import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Voice-to-Code API
// Processes voice transcripts and converts them into code suggestions
// using the z-ai-web-dev-sdk.
//
// SECURITY: All inputs validated with Zod. Transcript and context length
// capped to prevent token abuse. mode is enum-validated. language is
// allowlisted. filePath is sanitized.
// ---------------------------------------------------------------------------

interface CodeSuggestion {
  code: string;
  language: string;
  description: string;
  filePath?: string;
  action: 'insert' | 'replace' | 'command';
  range?: {
    startLine: number;
    endLine: number;
  };
}

const VOICE_MODES = ['generate', 'edit', 'command', 'explain'] as const;

const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'python', 'rust', 'go',
  'java', 'c', 'cpp', 'html', 'css', 'sql', 'shell',
  'ruby', 'php', 'swift', 'kotlin', 'dart', 'lua',
] as const;

const SANITIZED_PATH_REGEX = /^[a-zA-Z0-9_./-]+$/;

const postBodySchema = z.object({
  transcript: z.string().min(1).max(4000, 'Transcript exceeds maximum length'),
  language: z.enum(SUPPORTED_LANGUAGES).optional().default('typescript'),
  context: z.string().max(12000, 'Context exceeds maximum length').optional(),
  filePath: z.string().max(500).regex(SANITIZED_PATH_REGEX, 'filePath contains invalid characters').optional(),
  mode: z.enum(VOICE_MODES).optional().default('generate'),
}).strict();

/**
 * POST /api/voice
 * Process a voice transcript and convert it into code suggestions.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);
    const { transcript, language, context, filePath, mode } = body;

    // Use z-ai-web-dev-sdk to convert voice transcript to code
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Build a mode-specific system prompt
    const systemPrompt = buildSystemPrompt(mode, language, filePath);

    // Build the user prompt with context
    const userPrompt = buildUserPrompt(transcript, context, language, filePath, mode);

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI provider' },
        { status: 500 }
      );
    }

    // Parse the AI response into structured code suggestions
    const suggestions = parseCodeResponse(content, language, filePath, mode);

    return NextResponse.json({
      success: true,
      transcript,
      language,
      mode,
      suggestions,
      rawResponse: content,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Voice-to-code processing failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice
 * Get voice-to-code capabilities and supported languages.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    capabilities: {
      modes: [
        {
          id: 'generate',
          name: 'Generate Code',
          description: 'Generate new code from a voice description',
        },
        {
          id: 'edit',
          name: 'Edit Code',
          description: 'Edit existing code based on voice instructions',
        },
        {
          id: 'command',
          name: 'Execute Command',
          description: 'Convert voice to IDE commands (e.g., "open file", "run tests")',
        },
        {
          id: 'explain',
          name: 'Explain Code',
          description: 'Explain code or concepts based on voice questions',
        },
      ],
      supportedLanguages: SUPPORTED_LANGUAGES,
      voiceCommands: [
        'create a function that...',
        'add a class named...',
        'write a test for...',
        'refactor this to...',
        'fix the bug in...',
        'add error handling...',
        'document this function...',
        'optimize the loop...',
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(mode: string, language: string, filePath?: string): string {
  const basePrompt = `You are an AI code assistant in AICodeStudio IDE that converts voice transcripts into code. ` +
    `The user is speaking to you and you must convert their words into actionable code. ` +
    `Target language: ${language}. ${filePath ? `Target file: ${filePath}.` : ''}`;

  switch (mode) {
    case 'generate':
      return (
        basePrompt +
        `\n\nMode: CODE GENERATION` +
        `\nGenerate clean, idiomatic code based on the voice transcript.` +
        `\nRespond with the code in a markdown code block.` +
        `\nAlso provide a brief description of what the code does.` +
        `\n\nFormat your response as:` +
        `\nDESCRIPTION: <brief description>` +
        `\n\`\`\`${language}` +
        `\n<generated code>` +
        `\n\`\`\``
      );
    case 'edit':
      return (
        basePrompt +
        `\n\nMode: CODE EDITING` +
        `\nThe user wants to edit existing code. Provide the modified code.` +
        `\nRespond with the updated code in a markdown code block.` +
        `\n\nFormat your response as:` +
        `\nDESCRIPTION: <what changed>` +
        `\n\`\`\`${language}` +
        `\n<modified code>` +
        `\n\`\`\``
      );
    case 'command':
      return (
        basePrompt +
        `\n\nMode: IDE COMMAND` +
        `\nThe user is giving a voice command to the IDE. Convert it to a structured command.` +
        `\n\nFormat your response as JSON:` +
        `\n{"command": "<command-name>", "args": {...}}` +
        `\n\nCommon commands: openFile, runTask, togglePanel, search, gitCommit, formatDocument, organizeImports`
      );
    case 'explain':
      return (
        basePrompt +
        `\n\nMode: CODE EXPLANATION` +
        `\nThe user is asking about code or a concept. Provide a clear explanation.` +
        `\nUse markdown formatting with code examples where helpful.`
      );
    default:
      return basePrompt;
  }
}

function buildUserPrompt(
  transcript: string,
  context?: string,
  language?: string,
  filePath?: string,
  mode?: string
): string {
  let prompt = `Voice transcript: "${transcript}"`;

  if (context) {
    prompt += `\n\nCurrent code context:\n\`\`\`${language || 'text'}\n${context}\n\`\`\``;
  }

  if (filePath) {
    prompt += `\n\nWorking on file: ${filePath}`;
  }

  if (mode === 'edit' && context) {
    prompt += `\n\nPlease modify the code above based on the voice instruction.`;
  }

  return prompt;
}

function parseCodeResponse(
  content: string,
  language: string,
  filePath?: string,
  mode?: string
): CodeSuggestion[] {
  const suggestions: CodeSuggestion[] = [];

  if (mode === 'command') {
    // Try to parse as JSON command
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const command = JSON.parse(jsonMatch[0]);
        suggestions.push({
          code: JSON.stringify(command, null, 2),
          language: 'json',
          description: `Execute IDE command: ${command.command || 'unknown'}`,
          action: 'command',
        });
        return suggestions;
      }
    } catch {
      // Fall through to default parsing
    }
  }

  // Extract code blocks from the response
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const blockLang = match[1] || language;
    const code = match[2].trim();

    // Try to extract description
    const descMatch = content.match(/DESCRIPTION:\s*(.+)/);
    const description = descMatch ? descMatch[1].trim() : `Generated ${blockLang} code`;

    suggestions.push({
      code,
      language: blockLang,
      description,
      filePath,
      action: mode === 'edit' ? 'replace' : 'insert',
    });
  }

  // If no code blocks found, treat the whole response as an explanation
  if (suggestions.length === 0) {
    suggestions.push({
      code: content.trim(),
      language: 'markdown',
      description: mode === 'explain' ? 'Code explanation' : 'AI response',
      action: 'insert',
    });
  }

  return suggestions;
}
