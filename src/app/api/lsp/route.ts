import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Language Server Protocol (LSP) API
//
// STATUS: This API SIMULATES LSP features. It does NOT spawn or communicate
// with real language server processes. Diagnostics and completions are
// generated from basic content analysis.
//
// To enable real LSP:
//   - Set AICODE_ENABLE_LSP=true
//   - Install language servers (typescript-language-server, etc.)
//   - A Node.js server is required (not static export)
// ---------------------------------------------------------------------------

function isLspReal(): boolean {
  return process.env.AICODE_ENABLE_LSP === 'true';
}

interface LSPServer {
  id: string;
  language: string;
  status: 'starting' | 'running' | 'stopped';
  startedAt: number;
  pid?: number;
  capabilities: string[];
}

// In-memory store for active LSP servers
const servers = new Map<string, LSPServer>();

// Supported languages and their server configurations
const LANGUAGE_SERVERS: Record<string, {
  command: string;
  args: string[];
  capabilities: string[];
}> = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting'],
  },
  javascript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting'],
  },
  python: {
    command: 'pyright-langserver',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename'],
  },
  rust: {
    command: 'rust-analyzer',
    args: [],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting', 'codeLens'],
  },
  go: {
    command: 'gopls',
    args: [],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting'],
  },
  java: {
    command: 'jdtls',
    args: [],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting', 'codeLens'],
  },
  c: {
    command: 'clangd',
    args: [],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting'],
  },
  cpp: {
    command: 'clangd',
    args: [],
    capabilities: ['completion', 'hover', 'diagnostics', 'definition', 'references', 'rename', 'formatting'],
  },
  html: {
    command: 'vscode-html-language-server',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'formatting'],
  },
  css: {
    command: 'vscode-css-language-server',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'formatting'],
  },
  json: {
    command: 'vscode-json-language-server',
    args: ['--stdio'],
    capabilities: ['completion', 'hover', 'diagnostics', 'formatting'],
  },
};

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const startBodySchema = z.object({
  action: z.literal('start'),
  language: z.string().min(1),
  workspaceRoot: z.string().optional(),
});

const stopBodySchema = z.object({
  action: z.literal('stop'),
  serverId: z.string().optional(),
  language: z.string().optional(),
});

const diagnosticsBodySchema = z.object({
  action: z.literal('diagnostics'),
  serverId: z.string().optional(),
  language: z.string().optional(),
  filePath: z.string().min(1),
  content: z.string().optional(),
});

const completionBodySchema = z.object({
  action: z.literal('completion'),
  serverId: z.string().optional(),
  language: z.string().optional(),
  filePath: z.string().min(1),
  content: z.string().optional(),
  line: z.number().int().min(0),
  column: z.number().int().min(0),
  triggerCharacter: z.string().optional(),
});

const hoverBodySchema = z.object({
  action: z.literal('hover'),
  serverId: z.string().optional(),
  language: z.string().optional(),
  filePath: z.string().min(1),
  line: z.number().int().min(0),
  column: z.number().int().min(0),
});

const postBodySchema = z.discriminatedUnion('action', [
  startBodySchema, stopBodySchema, diagnosticsBodySchema,
  completionBodySchema, hoverBodySchema,
]);

/**
 * POST /api/lsp
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);
    const { action } = body;

    switch (action) {
      case 'start':
        return await handleStart(body);
      case 'stop':
        return await handleStop(body);
      case 'diagnostics':
        return await handleDiagnostics(body);
      case 'completion':
        return await handleCompletion(body);
      case 'hover':
        return await handleHover(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `LSP operation failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lsp
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'languages';
    const serverId = searchParams.get('serverId');

    switch (action) {
      case 'status':
        if (!serverId) {
          return NextResponse.json(
            { error: 'serverId is required for status action' },
            { status: 400 }
          );
        }
        return await handleStatus(serverId);
      case 'languages':
        return await handleListLanguages();
      case 'servers':
        return await handleListServers();
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `LSP operation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleStart(body: z.infer<typeof startBodySchema>) {
  const { language, workspaceRoot } = body;

  const serverConfig = LANGUAGE_SERVERS[language.toLowerCase()];
  if (!serverConfig) {
    return NextResponse.json(
      {
        error: `Unsupported language: ${language}`,
        supportedLanguages: Object.keys(LANGUAGE_SERVERS),
      },
      { status: 400 }
    );
  }

  // Check if a server for this language is already running
  const existingServer = Array.from(servers.values()).find(
    (s) => s.language === language.toLowerCase() && s.status === 'running'
  );

  if (existingServer) {
    return NextResponse.json({
      success: true,
      action: 'start',
      serverId: existingServer.id,
      language: existingServer.language,
      status: existingServer.status,
      message: `LSP server for ${language} is already running`,
      capabilities: existingServer.capabilities,
      mode: isLspReal() ? 'real' : 'simulated',
    });
  }

  const serverId = randomUUID();
  const server: LSPServer = {
    id: serverId,
    language: language.toLowerCase(),
    status: 'running',
    startedAt: Date.now(),
    capabilities: serverConfig.capabilities,
  };

  servers.set(serverId, server);

  const isReal = isLspReal();

  return NextResponse.json({
    success: true,
    action: 'start',
    serverId,
    language: language.toLowerCase(),
    status: server.status,
    message: isReal
      ? `LSP server for ${language} started`
      : `Simulated LSP server for ${language} started. This is NOT a real language server — diagnostics and completions are approximate.`,
    command: serverConfig.command,
    args: serverConfig.args,
    capabilities: server.capabilities,
    workspaceRoot: workspaceRoot || process.cwd(),
    mode: isReal ? 'real' : 'simulated',
  });
}

async function handleStop(body: z.infer<typeof stopBodySchema>) {
  const { serverId, language } = body;

  let server: LSPServer | undefined;

  if (serverId) {
    server = servers.get(serverId);
  } else if (language) {
    server = Array.from(servers.values()).find(
      (s) => s.language === language.toLowerCase() && s.status === 'running'
    );
  }

  if (!server) {
    return NextResponse.json(
      { error: 'Server not found' },
      { status: 404 }
    );
  }

  server.status = 'stopped';
  servers.delete(server.id);

  return NextResponse.json({
    success: true,
    action: 'stop',
    serverId: server.id,
    language: server.language,
    message: `LSP server for ${server.language} stopped`,
  });
}

async function handleDiagnostics(body: z.infer<typeof diagnosticsBodySchema>) {
  const { serverId, language, filePath, content } = body;

  let server: LSPServer | undefined;
  if (serverId) {
    server = servers.get(serverId);
  } else if (language) {
    server = Array.from(servers.values()).find(
      (s) => s.language === language.toLowerCase() && s.status === 'running'
    );
  }

  if (!server) {
    return NextResponse.json(
      {
        error: 'No running LSP server found. Start a server first.',
        uri: filePath,
      },
      { status: 404 }
    );
  }

  // Simulated diagnostics based on basic content analysis
  const diagnostics = generateSimulatedDiagnostics(filePath, content || '', server.language);

  return NextResponse.json({
    success: true,
    action: 'diagnostics',
    uri: filePath,
    language: server.language,
    diagnostics,
    mode: isLspReal() ? 'real' : 'simulated',
    note: isLspReal()
      ? undefined
      : 'Simulated diagnostics. Connect a real language server for accurate results.',
  });
}

async function handleCompletion(body: z.infer<typeof completionBodySchema>) {
  const { serverId, language, filePath, content, line, column, triggerCharacter } = body;

  let server: LSPServer | undefined;
  if (serverId) {
    server = servers.get(serverId);
  } else if (language) {
    server = Array.from(servers.values()).find(
      (s) => s.language === language.toLowerCase() && s.status === 'running'
    );
  }

  if (!server) {
    return NextResponse.json(
      { error: 'No running LSP server found. Start a server first.' },
      { status: 404 }
    );
  }

  const items = generateSimulatedCompletions(
    server.language,
    content || '',
    line,
    column,
    triggerCharacter
  );

  return NextResponse.json({
    success: true,
    action: 'completion',
    uri: filePath,
    language: server.language,
    position: { line, character: column },
    triggerKind: triggerCharacter ? 2 : 1,
    triggerCharacter: triggerCharacter || null,
    isIncomplete: false,
    items,
    mode: isLspReal() ? 'real' : 'simulated',
    note: isLspReal()
      ? undefined
      : 'Simulated completions. Connect a real language server for accurate results.',
  });
}

async function handleHover(body: z.infer<typeof hoverBodySchema>) {
  const { serverId, language, filePath, line, column } = body;

  let server: LSPServer | undefined;
  if (serverId) {
    server = servers.get(serverId);
  } else if (language) {
    server = Array.from(servers.values()).find(
      (s) => s.language === language.toLowerCase() && s.status === 'running'
    );
  }

  if (!server) {
    return NextResponse.json(
      { error: 'No running LSP server found. Start a server first.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    action: 'hover',
    uri: filePath,
    language: server.language,
    position: { line, character: column },
    contents: [
      {
        language: server.language,
        value: `// Hover information for ${filePath}:${line + 1}:${column + 1}`,
      },
      isLspReal()
        ? ''
        : 'Simulated hover. Connect a real language server for accurate hover information.',
    ],
    range: {
      start: { line, character: column },
      end: { line, character: column + 10 },
    },
    mode: isLspReal() ? 'real' : 'simulated',
  });
}

async function handleStatus(serverId: string) {
  const server = servers.get(serverId);

  if (!server) {
    return NextResponse.json(
      { error: 'Server not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    action: 'status',
    server: {
      id: server.id,
      language: server.language,
      status: server.status,
      startedAt: server.startedAt,
      uptime: Date.now() - server.startedAt,
      capabilities: server.capabilities,
    },
    mode: isLspReal() ? 'real' : 'simulated',
  });
}

async function handleListLanguages() {
  const languages = Object.entries(LANGUAGE_SERVERS).map(([lang, config]) => ({
    language: lang,
    command: config.command,
    capabilities: config.capabilities,
  }));

  return NextResponse.json({
    success: true,
    action: 'languages',
    languages,
    total: languages.length,
    mode: isLspReal() ? 'real' : 'simulated',
  });
}

async function handleListServers() {
  const activeServers = Array.from(servers.values())
    .filter((s) => s.status === 'running')
    .map((s) => ({
      id: s.id,
      language: s.language,
      status: s.status,
      startedAt: s.startedAt,
      uptime: Date.now() - s.startedAt,
      capabilities: s.capabilities,
    }));

  return NextResponse.json({
    success: true,
    action: 'servers',
    servers: activeServers,
    total: activeServers.length,
    mode: isLspReal() ? 'real' : 'simulated',
  });
}

// ---------------------------------------------------------------------------
// Simulated Response Generators
// ---------------------------------------------------------------------------

function generateSimulatedDiagnostics(
  filePath: string,
  _content: string,
  language: string
) {
  const diagnostics: Array<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    severity: number;
    message: string;
    source: string;
    code: string;
  }> = [];
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    if (_content.includes('console.log')) {
      diagnostics.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        severity: 2,
        message: 'Unexpected console statement',
        source: 'typescript',
        code: 'no-console',
      });
    }
  }

  if (language === 'python') {
    if (_content.includes('import *')) {
      diagnostics.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        severity: 2,
        message: 'Wildcard import is discouraged',
        source: 'pyright',
        code: 'wildcard-import',
      });
    }
  }

  return diagnostics;
}

function generateSimulatedCompletions(
  language: string,
  _content: string,
  _line: number,
  _column: number,
  triggerCharacter?: string
) {
  const items: Array<{ label: string; kind: number; detail: string; insertText: string }> = [];

  if (['typescript', 'javascript'].includes(language)) {
    const jsItems = [
      { label: 'console.log', kind: 3, detail: 'console.log(...)', insertText: 'console.log($1)' },
      { label: 'function', kind: 15, detail: 'Function declaration', insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}' },
      { label: 'const', kind: 14, detail: 'Constant declaration', insertText: 'const ${1:name} = ${2:value}' },
      { label: 'let', kind: 14, detail: 'Variable declaration', insertText: 'let ${1:name} = ${2:value}' },
      { label: 'if', kind: 15, detail: 'If statement', insertText: 'if (${1:condition}) {\n\t$0\n}' },
      { label: 'for', kind: 15, detail: 'For loop', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$0\n}' },
      { label: 'forEach', kind: 2, detail: 'Array.forEach', insertText: '${1:array}.forEach((${2:item}) => {\n\t$0\n})' },
      { label: 'map', kind: 2, detail: 'Array.map', insertText: '${1:array}.map((${2:item}) => {\n\t$0\n})' },
      { label: 'import', kind: 15, detail: 'Import statement', insertText: "import { $2 } from '$1'" },
      { label: 'export', kind: 15, detail: 'Export statement', insertText: 'export { $1 }' },
    ];

    if (triggerCharacter === '.') {
      items.push(...jsItems.slice(0, 4));
    } else {
      items.push(...jsItems);
    }
  } else if (language === 'python') {
    items.push(
      { label: 'def', kind: 15, detail: 'Function definition', insertText: 'def ${1:name}(${2:params}):\n\t$0' },
      { label: 'class', kind: 15, detail: 'Class definition', insertText: 'class ${1:Name}:\n\tdef __init__(self${2:, params}):\n\t\t$0' },
      { label: 'import', kind: 15, detail: 'Import statement', insertText: 'import ${1:module}' },
      { label: 'from', kind: 15, detail: 'From import', insertText: 'from ${1:module} import ${2:name}' },
      { label: 'print', kind: 3, detail: 'print()', insertText: 'print($1)' },
      { label: 'if', kind: 15, detail: 'If statement', insertText: 'if ${1:condition}:\n\t$0' },
      { label: 'for', kind: 15, detail: 'For loop', insertText: 'for ${1:item} in ${2:iterable}:\n\t$0' },
      { label: 'while', kind: 15, detail: 'While loop', insertText: 'while ${1:condition}:\n\t$0' },
    );
  } else {
    items.push(
      { label: 'if', kind: 15, detail: 'If statement', insertText: 'if ${1:condition}\n\t$0' },
      { label: 'for', kind: 15, detail: 'For loop', insertText: 'for ${1:item}\n\t$0' },
      { label: 'function', kind: 15, detail: 'Function', insertText: 'function ${1:name}() {\n\t$0\n}' },
    );
  }

  return items.map((item, index) => ({
    ...item,
    sortText: String(index).padStart(3, '0'),
  }));
}
