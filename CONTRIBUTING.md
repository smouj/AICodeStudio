# Contributing to AICodeStudio

Thank you for your interest in contributing to AICodeStudio! We welcome contributions from everyone. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful, constructive, and inclusive. We are all here to build something great together.

## How to Contribute

### Reporting Bugs
- Open an issue with a clear description of the bug
- Include steps to reproduce, expected behavior, and actual behavior
- Add screenshots if applicable
- Specify your browser, OS, and AICodeStudio version

### Suggesting Features
- Open an issue with the tag `enhancement`
- Describe the feature and why it would be useful
- Include mockups or examples if possible
- Check if the feature is already on the [Roadmap](README.md#-roadmap)

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure the build passes (`npm run build`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/AICodeStudio.git
cd AICodeStudio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the IDE.

### Environment Variables (Optional)
Create a `.env.local` file for optional API keys:
```
# AI Provider (optional — users configure their own keys in the UI)
AI_API_KEY=your-key-here

# GitHub Token (optional — for higher rate limits)
GITHUB_TOKEN=your-token-here
```

## Project Structure

```
src/
├── app/
│   ├── api/            # Backend API routes (10 endpoints)
│   ├── globals.css     # Theme variables and global styles
│   ├── layout.tsx      # Root layout with PWA metadata
│   └── page.tsx        # Main entry point → IDEMain
├── components/
│   ├── ide/            # IDE-specific components (25 files)
│   └── ui/             # shadcn/ui reusable components
├── store/
│   └── ide-store.ts    # Zustand global state
└── lib/
    └── utils.ts        # Shared utilities
```

### Key Files
- **`ide-main.tsx`** — Main orchestrator composing all IDE panels
- **`ide-store-enhanced.ts`** — Complete Zustand store with virtual file system, settings, AI, Git, Docker, Database, Collaboration, LSP, Voice, Themes, Canvas, and TODO state
- **`editor-area.tsx`** — Monaco Editor wrapper with custom theme and settings integration
- **`activity-bar.tsx`** — Left sidebar with 14 panel icons

## Code Style

- **TypeScript** for all new files — no `.js` or `.jsx` files
- **Functional React components** with hooks — no class components
- **Zustand** for state management — no Redux or Context for global state
- **Tailwind CSS** for styling — no inline styles or CSS modules
- **kebab-case** for component filenames (`ai-chat.tsx`, `docker-panel.tsx`)
- **PascalCase** for component exports (`AIChatPanel`, `DockerPanel`)
- Follow the existing component structure and patterns
- Use `lucide-react` for icons (check available icons before adding new ones)
- All colors must use the `#00d4aa` accent or the existing grayscale palette

### Component Pattern
```tsx
'use client'

import { useState } from 'react'
import { useIDEStore } from '@/store/ide-store'

export function MyNewPanel() {
  const { relevantState, relevantAction } = useIDEStore()
  const [localState, setLocalState] = useState('')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#484f58] border-b border-white/[0.06]">
        <span>Panel Title</span>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* Panel content */}
      </div>
    </div>
  )
}
```

## Commit Guidelines

Use conventional commit messages:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add Docker container logs viewer
fix: resolve terminal command history navigation
docs: update README with new screenshots
refactor: extract shared panel header component
```

## Pull Request Process

1. **Update documentation** if your change affects the user interface or adds new features
2. **Add screenshots** to the PR description for any visual changes
3. **Test your changes** in both light and dark themes
4. **Ensure accessibility** — add ARIA labels and keyboard navigation where appropriate
5. **No secrets** — never commit API keys, tokens, or passwords. All user credentials are configured through the UI and stored in the browser only
6. **Squash commits** if your PR has many small fix-up commits

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
