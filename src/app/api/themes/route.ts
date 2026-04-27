import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Themes Marketplace API
// Provides theme metadata with color definitions.
// In production, themes would be fetched from a registry or database.
// ---------------------------------------------------------------------------

interface ThemeDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'dark' | 'light';
  author: string;
  version: string;
  rating: number;
  downloadCount: number;
  tags: string[];
  colors: ThemeColors;
  tokenColors: TokenColor[];
  iconUrl?: string;
}

interface ThemeColors {
  // Editor colors
  'editor.background': string;
  'editor.foreground': string;
  'editor.lineHighlightBackground': string;
  'editor.selectionBackground': string;
  'editorCursor.foreground': string;
  'editorWhitespace.foreground': string;
  'editorIndentGuide.background': string;
  // UI colors
  'activityBar.background': string;
  'activityBar.foreground': string;
  'sideBar.background': string;
  'sideBar.foreground': string;
  'statusBar.background': string;
  'statusBar.foreground': string;
  'terminal.background': string;
  'terminal.foreground': string;
  'titleBar.activeBackground': string;
  'titleBar.activeForeground': string;
  'input.background': string;
  'input.foreground': string;
  'input.border': string;
  'panel.background': string;
  'panel.border': string;
  // Accent
  'focusBorder': string;
  'button.background': string;
  'button.foreground': string;
}

interface TokenColor {
  name: string;
  scope: string[];
  settings: {
    foreground?: string;
    fontStyle?: string;
    background?: string;
  };
}

// Curated theme collection
const THEME_REGISTRY: ThemeDefinition[] = [
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    displayName: 'One Dark Pro',
    description: 'Atom\'s iconic One Dark theme for AICodeStudio',
    type: 'dark',
    author: 'binaryify',
    version: '3.17.2',
    rating: 4.8,
    downloadCount: 4250000,
    tags: ['dark', 'popular', 'atom', 'one-dark'],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313c',
      'editor.selectionBackground': '#3e4451',
      'editorCursor.foreground': '#528bff',
      'editorWhitespace.foreground': '#3b4048',
      'editorIndentGuide.background': '#3b4048',
      'activityBar.background': '#282c34',
      'activityBar.foreground': '#d7dae0',
      'sideBar.background': '#21252b',
      'sideBar.foreground': '#abb2bf',
      'statusBar.background': '#21252b',
      'statusBar.foreground': '#9da5b4',
      'terminal.background': '#282c34',
      'terminal.foreground': '#abb2bf',
      'titleBar.activeBackground': '#282c34',
      'titleBar.activeForeground': '#9da5b4',
      'input.background': '#1e222a',
      'input.foreground': '#abb2bf',
      'input.border': '#3b4048',
      'panel.background': '#282c34',
      'panel.border': '#3b4048',
      'focusBorder': '#528bff',
      'button.background': '#3e4451',
      'button.foreground': '#abb2bf',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#5c6370', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#c678dd' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#98c379' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#d19a66' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#61afef' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#e06c75' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#e5c07b' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#56b6c2' } },
    ],
  },
  {
    id: 'dracula',
    name: 'Dracula Official',
    displayName: 'Dracula',
    description: 'Official Dracula Theme for AICodeStudio',
    type: 'dark',
    author: 'dracula-theme',
    version: '2.25.1',
    rating: 4.7,
    downloadCount: 3120000,
    tags: ['dark', 'popular', 'dracula', 'purple'],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f2',
      'editorWhitespace.foreground': '#3b3b4e',
      'editorIndentGuide.background': '#3b3b4e',
      'activityBar.background': '#282a36',
      'activityBar.foreground': '#f8f8f2',
      'sideBar.background': '#21222c',
      'sideBar.foreground': '#f8f8f2',
      'statusBar.background': '#191a21',
      'statusBar.foreground': '#f8f8f2',
      'terminal.background': '#282a36',
      'terminal.foreground': '#f8f8f2',
      'titleBar.activeBackground': '#21222c',
      'titleBar.activeForeground': '#f8f8f2',
      'input.background': '#21222c',
      'input.foreground': '#f8f8f2',
      'input.border': '#44475a',
      'panel.background': '#282a36',
      'panel.border': '#44475a',
      'focusBorder': '#bd93f9',
      'button.background': '#44475a',
      'button.foreground': '#f8f8f2',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#6272a4', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#ff79c6' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#f1fa8c' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#bd93f9' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#50fa7b' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#f8f8f2' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#8be9fd', fontStyle: 'italic' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#ff79c6' } },
    ],
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    displayName: 'GitHub Dark',
    description: 'GitHub theme for AICodeStudio — Dark',
    type: 'dark',
    author: 'github',
    version: '7.3.0',
    rating: 4.6,
    downloadCount: 2890000,
    tags: ['dark', 'popular', 'github'],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#58a6ff',
      'editorWhitespace.foreground': '#30363d',
      'editorIndentGuide.background': '#21262d',
      'activityBar.background': '#0d1117',
      'activityBar.foreground': '#c9d1d9',
      'sideBar.background': '#0d1117',
      'sideBar.foreground': '#c9d1d9',
      'statusBar.background': '#0d1117',
      'statusBar.foreground': '#c9d1d9',
      'terminal.background': '#0d1117',
      'terminal.foreground': '#c9d1d9',
      'titleBar.activeBackground': '#0d1117',
      'titleBar.activeForeground': '#c9d1d9',
      'input.background': '#0d1117',
      'input.foreground': '#c9d1d9',
      'input.border': '#30363d',
      'panel.background': '#0d1117',
      'panel.border': '#30363d',
      'focusBorder': '#58a6ff',
      'button.background': '#238636',
      'button.foreground': '#ffffff',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#8b949e', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#ff7b72' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#a5d6ff' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#79c0ff' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#d2a8ff' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#ffa657' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#ff7b72' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#79c0ff' } },
    ],
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    displayName: 'Solarized Dark',
    description: 'Solarized dark theme for AICodeStudio',
    type: 'dark',
    author: 'ryanolsonx',
    version: '1.1.1',
    rating: 4.3,
    downloadCount: 890000,
    tags: ['dark', 'solarized', 'classic'],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#073642',
      'editor.selectionBackground': '#073642',
      'editorCursor.foreground': '#839496',
      'editorWhitespace.foreground': '#073642',
      'editorIndentGuide.background': '#073642',
      'activityBar.background': '#002b36',
      'activityBar.foreground': '#839496',
      'sideBar.background': '#002b36',
      'sideBar.foreground': '#839496',
      'statusBar.background': '#002b36',
      'statusBar.foreground': '#839496',
      'terminal.background': '#002b36',
      'terminal.foreground': '#839496',
      'titleBar.activeBackground': '#002b36',
      'titleBar.activeForeground': '#839496',
      'input.background': '#002b36',
      'input.foreground': '#839496',
      'input.border': '#073642',
      'panel.background': '#002b36',
      'panel.border': '#073642',
      'focusBorder': '#268bd2',
      'button.background': '#073642',
      'button.foreground': '#839496',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#586e75', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#859900' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#2aa198' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#d33682' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#268bd2' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#b58900' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#b58900' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#859900' } },
    ],
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    displayName: 'GitHub Light',
    description: 'GitHub theme for AICodeStudio — Light',
    type: 'light',
    author: 'github',
    version: '7.3.0',
    rating: 4.4,
    downloadCount: 1560000,
    tags: ['light', 'popular', 'github'],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#b6e3ff',
      'editorCursor.foreground': '#0969da',
      'editorWhitespace.foreground': '#d0d7de',
      'editorIndentGuide.background': '#eff2f5',
      'activityBar.background': '#f6f8fa',
      'activityBar.foreground': '#24292f',
      'sideBar.background': '#f6f8fa',
      'sideBar.foreground': '#24292f',
      'statusBar.background': '#f6f8fa',
      'statusBar.foreground': '#24292f',
      'terminal.background': '#ffffff',
      'terminal.foreground': '#24292f',
      'titleBar.activeBackground': '#f6f8fa',
      'titleBar.activeForeground': '#24292f',
      'input.background': '#ffffff',
      'input.foreground': '#24292f',
      'input.border': '#d0d7de',
      'panel.background': '#ffffff',
      'panel.border': '#d0d7de',
      'focusBorder': '#0969da',
      'button.background': '#2da44e',
      'button.foreground': '#ffffff',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#6e7781', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#cf222e' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#0a3069' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#0550ae' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#8250df' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#953800' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#cf222e' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#0550ae' } },
    ],
  },
  {
    id: 'nord',
    name: 'Nord',
    displayName: 'Nord',
    description: 'An arctic, north-bluish clean and elegant theme',
    type: 'dark',
    author: 'arcticicestudio',
    version: '0.19.0',
    rating: 4.5,
    downloadCount: 1230000,
    tags: ['dark', 'nord', 'bluish', 'elegant'],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editor.lineHighlightBackground': '#3b4252',
      'editor.selectionBackground': '#434c5e',
      'editorCursor.foreground': '#d8dee9',
      'editorWhitespace.foreground': '#4c566a',
      'editorIndentGuide.background': '#434c5e',
      'activityBar.background': '#2e3440',
      'activityBar.foreground': '#d8dee9',
      'sideBar.background': '#2e3440',
      'sideBar.foreground': '#d8dee9',
      'statusBar.background': '#2e3440',
      'statusBar.foreground': '#d8dee9',
      'terminal.background': '#2e3440',
      'terminal.foreground': '#d8dee9',
      'titleBar.activeBackground': '#2e3440',
      'titleBar.activeForeground': '#d8dee9',
      'input.background': '#3b4252',
      'input.foreground': '#d8dee9',
      'input.border': '#3b4252',
      'panel.background': '#2e3440',
      'panel.border': '#3b4252',
      'focusBorder': '#88c0d0',
      'button.background': '#434c5e',
      'button.foreground': '#d8dee9',
    },
    tokenColors: [
      { name: 'Comment', scope: ['comment'], settings: { foreground: '#616e88', fontStyle: 'italic' } },
      { name: 'Keyword', scope: ['keyword'], settings: { foreground: '#81a1c1' } },
      { name: 'String', scope: ['string'], settings: { foreground: '#a3be8c' } },
      { name: 'Number', scope: ['constant.numeric'], settings: { foreground: '#b48ead' } },
      { name: 'Function', scope: ['entity.name.function'], settings: { foreground: '#88c0d0' } },
      { name: 'Variable', scope: ['variable'], settings: { foreground: '#d8dee9' } },
      { name: 'Type', scope: ['entity.name.type'], settings: { foreground: '#8fbcbb' } },
      { name: 'Operator', scope: ['keyword.operator'], settings: { foreground: '#81a1c1' } },
    ],
  },
];

// In-memory store for user-installed themes
const installedThemes = new Map<string, ThemeDefinition>();

/**
 * GET /api/themes
 * List available themes.
 * Query params:
 *   - type: dark | light (optional filter)
 *   - search: search by name/description
 *   - sort: popular | rating | name (default: popular)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'popular';

    // Combine registry themes with installed themes
    let allThemes = [...THEME_REGISTRY, ...Array.from(installedThemes.values())];

    // Filter by type
    if (type && (type === 'dark' || type === 'light')) {
      allThemes = allThemes.filter((t) => t.type === type);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      allThemes = allThemes.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.displayName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sort) {
      case 'rating':
        allThemes.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        allThemes.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'popular':
      default:
        allThemes.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
    }

    const themes = allThemes.map((t) => ({
      id: t.id,
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      type: t.type,
      author: t.author,
      version: t.version,
      rating: t.rating,
      downloadCount: t.downloadCount,
      tags: t.tags,
      installed: installedThemes.has(t.id),
    }));

    return NextResponse.json({
      success: true,
      themes,
      total: themes.length,
      filters: { type, search, sort },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to list themes: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/themes
 * Install a theme or get theme details / popular themes.
 * Body: { action: 'install'|'detail'|'popular', ...params }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'install':
        return await handleInstall(body);
      case 'detail':
        return await handleDetail(body);
      case 'popular':
        return await handlePopular(body);
      case 'create':
        return await handleCreate(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: install, detail, popular, create` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Theme operation failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleInstall(body: { themeId?: string }) {
  const { themeId } = body;

  if (!themeId) {
    return NextResponse.json(
      { error: 'themeId is required' },
      { status: 400 }
    );
  }

  const theme = THEME_REGISTRY.find((t) => t.id === themeId);
  if (!theme) {
    return NextResponse.json(
      { error: `Theme ${themeId} not found in registry` },
      { status: 404 }
    );
  }

  installedThemes.set(themeId, theme);

  return NextResponse.json({
    success: true,
    action: 'install',
    themeId,
    message: `Theme "${theme.displayName}" installed successfully`,
    theme: {
      id: theme.id,
      name: theme.name,
      type: theme.type,
    },
  });
}

async function handleDetail(body: { themeId?: string }) {
  const { themeId } = body;

  if (!themeId) {
    return NextResponse.json(
      { error: 'themeId is required' },
      { status: 400 }
    );
  }

  const allThemes = [...THEME_REGISTRY, ...Array.from(installedThemes.values())];
  const theme = allThemes.find((t) => t.id === themeId);

  if (!theme) {
    return NextResponse.json(
      { error: `Theme ${themeId} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    action: 'detail',
    theme,
  });
}

async function handlePopular(body: { type?: string; limit?: number }) {
  const type = body.type;
  const limit = body.limit || 10;

  let themes = [...THEME_REGISTRY];

  if (type && (type === 'dark' || type === 'light')) {
    themes = themes.filter((t) => t.type === type);
  }

  themes.sort((a, b) => b.downloadCount - a.downloadCount);
  themes = themes.slice(0, limit);

  return NextResponse.json({
    success: true,
    action: 'popular',
    themes: themes.map((t) => ({
      id: t.id,
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      type: t.type,
      author: t.author,
      rating: t.rating,
      downloadCount: t.downloadCount,
      installed: installedThemes.has(t.id),
    })),
    total: themes.length,
  });
}

async function handleCreate(body: {
  name?: string;
  displayName?: string;
  description?: string;
  type?: 'dark' | 'light';
  author?: string;
  colors?: Partial<ThemeColors>;
  tokenColors?: TokenColor[];
}) {
  const { name, displayName, description, type, author, colors, tokenColors } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: 'name and type are required' },
      { status: 400 }
    );
  }

  // Default colors based on type
  const defaultColors: ThemeColors = type === 'dark'
    ? {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#313244',
        'editor.selectionBackground': '#45475a',
        'editorCursor.foreground': '#f5e0dc',
        'editorWhitespace.foreground': '#45475a',
        'editorIndentGuide.background': '#313244',
        'activityBar.background': '#1e1e2e',
        'activityBar.foreground': '#cdd6f4',
        'sideBar.background': '#181825',
        'sideBar.foreground': '#cdd6f4',
        'statusBar.background': '#181825',
        'statusBar.foreground': '#cdd6f4',
        'terminal.background': '#1e1e2e',
        'terminal.foreground': '#cdd6f4',
        'titleBar.activeBackground': '#1e1e2e',
        'titleBar.activeForeground': '#cdd6f4',
        'input.background': '#313244',
        'input.foreground': '#cdd6f4',
        'input.border': '#45475a',
        'panel.background': '#1e1e2e',
        'panel.border': '#313244',
        'focusBorder': '#89b4fa',
        'button.background': '#45475a',
        'button.foreground': '#cdd6f4',
      }
    : {
        'editor.background': '#eff1f5',
        'editor.foreground': '#4c4f69',
        'editor.lineHighlightBackground': '#e6e9ef',
        'editor.selectionBackground': '#ccd0da',
        'editorCursor.foreground': '#dc8a78',
        'editorWhitespace.foreground': '#bcc0cc',
        'editorIndentGuide.background': '#ccd0da',
        'activityBar.background': '#eff1f5',
        'activityBar.foreground': '#4c4f69',
        'sideBar.background': '#e6e9ef',
        'sideBar.foreground': '#4c4f69',
        'statusBar.background': '#e6e9ef',
        'statusBar.foreground': '#4c4f69',
        'terminal.background': '#eff1f5',
        'terminal.foreground': '#4c4f69',
        'titleBar.activeBackground': '#eff1f5',
        'titleBar.activeForeground': '#4c4f69',
        'input.background': '#e6e9ef',
        'input.foreground': '#4c4f69',
        'input.border': '#ccd0da',
        'panel.background': '#eff1f5',
        'panel.border': '#ccd0da',
        'focusBorder': '#1e66f5',
        'button.background': '#1e66f5',
        'button.foreground': '#ffffff',
      };

  // Merge user-provided colors with defaults
  const mergedColors = { ...defaultColors, ...colors };

  const newTheme: ThemeDefinition = {
    id: `custom-${randomUUID().slice(0, 8)}`,
    name,
    displayName: displayName || name,
    description: description || `Custom ${type} theme`,
    type,
    author: author || 'AICodeStudio User',
    version: '1.0.0',
    rating: 0,
    downloadCount: 0,
    tags: ['custom', type],
    colors: mergedColors,
    tokenColors: tokenColors || [],
  };

  installedThemes.set(newTheme.id, newTheme);

  return NextResponse.json({
    success: true,
    action: 'create',
    theme: newTheme,
    message: `Custom theme "${displayName || name}" created successfully`,
  });
}
