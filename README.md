# HappyNote

A minimal, Typora-like Markdown editor that lives in your browser. Click the extension icon, get a full-featured writing environment — no server, no account, your notes stay local.

## Features

- **WYSIWYG Markdown** — Powered by Milkdown, what you see is what you get
- **Multi-document** — Create, switch, and manage multiple notes
- **Auto-save** — Changes are saved automatically to IndexedDB
- **Command Palette** — Quick search and switch notes with `Ctrl+P`
- **Table of Contents** — Outline navigation with `Ctrl+L`
- **Dark Mode** — Toggle with `Ctrl+D`
- **Tables** — Grid-based insert for easy table creation
- **LaTeX** — Inline and block math with symbol panel
- **Image Paste** — Paste or upload images, persisted locally
- **Code Blocks** — Syntax highlighting with collapsible blocks
- **Customizable** — Font family, font size, code font settings
- **Keyboard-first** — Full shortcut support with cheatsheet (`Ctrl+?`)

## Tech Stack

- [WXT](https://wxt.dev) — Browser extension framework
- [React 19](https://react.dev) + TypeScript
- [Milkdown](https://milkdown.dev) (Crepe) — WYSIWYG Markdown editor
- [TailwindCSS 4](https://tailwindcss.com)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via `idb` — Local persistence

## Getting Started

```bash
# Install dependencies
bun install

# Dev mode (Chrome)
bun run dev

# Build for production
bun run build

# Package as zip
bun run zip
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New note |
| `Ctrl+P` | Command palette |
| `Ctrl+L` | Toggle outline |
| `Ctrl+D` | Toggle dark mode |
| `Ctrl+,` | Settings |
| `Ctrl+?` | Shortcuts help |
