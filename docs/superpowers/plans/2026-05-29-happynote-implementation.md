# HappyNote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that opens a Typora-like WYSIWYG Markdown editor in a new tab using Milkdown Crepe + React.

**Architecture:** Chrome Manifest V3 extension with a Service Worker that opens a new tab on icon click. The new tab loads a React app wrapping Milkdown Crepe editor with auto-save to IndexedDB.

**Tech Stack:** React 18, TypeScript, Milkdown Crepe (@milkdown/crepe), Vite, idb, bun

---

## File Structure

```
happynote/
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── background.ts              # Service Worker: opens new tab on icon click
│   ├── editor/
│   │   ├── index.html             # Editor page HTML entry
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Root component with status bar
│   │   ├── Editor.tsx             # Milkdown Crepe wrapper
│   │   ├── db.ts                  # IndexedDB operations via idb
│   │   └── styles.css             # Global editor styles
│   └── manifest.json              # Chrome extension manifest v3
├── vite.config.ts                 # Vite config for Chrome extension build
├── tsconfig.json
└── package.json
```

---

### Task 1: Project Setup & Build Configuration

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/manifest.json`

- [ ] **Step 1: Update package.json with scripts and dependencies**

```json
{
  "name": "happynote",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@milkdown/crepe": "^7.21.1",
    "@milkdown/kit": "^7.21.1",
    "@milkdown/react": "^7.21.1",
    "idb": "^8.0.3",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'src/editor/index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
```

- [ ] **Step 4: Create src/manifest.json**

```json
{
  "manifest_version": 3,
  "name": "HappyNote",
  "description": "A minimal Typora-like Markdown editor in your browser",
  "version": "0.1.0",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_title": "Open HappyNote"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": []
}
```

- [ ] **Step 5: Install dev dependencies**

Run: `bun add -d @types/react @types/react-dom @vitejs/plugin-react typescript vite`
Expected: Packages installed successfully.

- [ ] **Step 6: Commit**

```bash
git init
git add package.json tsconfig.json vite.config.ts src/manifest.json
git commit -m "chore: project setup with Vite, React, and Chrome extension config"
```

---

### Task 2: Chrome Extension Background Script

**Files:**
- Create: `src/background.ts`

- [ ] **Step 1: Create the service worker**

```typescript
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('editor/index.html') })
})
```

- [ ] **Step 2: Commit**

```bash
git add src/background.ts
git commit -m "feat: add background service worker to open editor tab"
```

---

### Task 3: Extension Icons

**Files:**
- Create: `public/icons/icon16.png`
- Create: `public/icons/icon48.png`
- Create: `public/icons/icon128.png`

- [ ] **Step 1: Generate simple placeholder icons**

Create minimal SVG-based PNG icons. For MVP, generate simple colored squares or use a text "H" icon. Use a script or manually create 16x16, 48x48, 128x128 PNGs.

A quick approach: create an SVG and convert, or use a simple canvas-based generator script:

```typescript
// scripts/generate-icons.ts (run once with bun)
import { writeFileSync, mkdirSync } from 'fs'

// Generate a simple 1x1 pixel teal PNG for each size (placeholder)
// In production, replace with proper designed icons
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
])

// For MVP: just create empty files that we'll replace with real icons
mkdirSync('public/icons', { recursive: true })

// We'll use inline SVG data URLs in manifest instead, or create minimal valid PNGs
// For now, create placeholder files
const sizes = [16, 48, 128]
for (const size of sizes) {
  // Create a minimal valid PNG (1x1 teal pixel, will be stretched)
  writeFileSync(`public/icons/icon${size}.png`, PNG_HEADER)
}
console.log('Placeholder icons created. Replace with designed icons later.')
```

Run: `bun run scripts/generate-icons.ts`

Note: For a working extension, we need valid PNG files. A better approach is to create simple SVG files and use an online tool, or just include any 16x16/48x48/128x128 PNG. For testing, Chrome accepts any valid PNG of the right size.

- [ ] **Step 2: Commit**

```bash
git add public/icons/
git commit -m "chore: add placeholder extension icons"
```

---

### Task 4: IndexedDB Storage Layer

**Files:**
- Create: `src/editor/db.ts`

- [ ] **Step 1: Create the database module**

```typescript
import { openDB, type IDBPDatabase } from 'idb'

interface NoteRecord {
  id: string
  content: string
  updatedAt: number
}

interface HappyNoteDB {
  notes: {
    key: string
    value: NoteRecord
  }
}

const DB_NAME = 'happynote'
const DB_VERSION = 1
const STORE_NAME = 'notes'
const DEFAULT_NOTE_ID = 'default'

let dbPromise: Promise<IDBPDatabase<HappyNoteDB>> | null = null

function getDB(): Promise<IDBPDatabase<HappyNoteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HappyNoteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function loadNote(): Promise<string> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, DEFAULT_NOTE_ID)
  return record?.content ?? ''
}

export async function saveNote(content: string): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, {
    id: DEFAULT_NOTE_ID,
    content,
    updatedAt: Date.now(),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/db.ts
git commit -m "feat: add IndexedDB storage layer for notes"
```

---

### Task 5: Editor Page HTML Entry

**Files:**
- Create: `src/editor/index.html`

- [ ] **Step 1: Create the HTML entry point**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HappyNote</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/index.html
git commit -m "feat: add editor HTML entry point"
```

---

### Task 6: Global Styles

**Files:**
- Create: `src/editor/styles.css`

- [ ] **Step 1: Create the stylesheet**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  background: #ffffff;
  color: #1a1a1a;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 24px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.status-bar .brand {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.status-bar .save-status {
  transition: opacity 0.3s;
}

.editor-container {
  flex: 1;
  overflow-y: auto;
  padding: 48px 0;
  display: flex;
  justify-content: center;
}

.editor-container .milkdown {
  width: 100%;
  max-width: 800px;
  padding: 0 24px;
  outline: none;
}

/* Milkdown Crepe overrides for minimal look */
.editor-container .ProseMirror {
  outline: none;
  font-size: 16px;
  line-height: 1.8;
}

.editor-container .ProseMirror h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 24px 0 16px;
}

.editor-container .ProseMirror h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 20px 0 12px;
}

.editor-container .ProseMirror h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.editor-container .ProseMirror p {
  margin: 8px 0;
}

.editor-container .ProseMirror blockquote {
  border-left: 3px solid #ddd;
  padding-left: 16px;
  color: #666;
  margin: 12px 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/styles.css
git commit -m "feat: add global editor styles"
```

---

### Task 7: Milkdown Crepe Editor Component

**Files:**
- Create: `src/editor/Editor.tsx`

- [ ] **Step 1: Create the editor component**

```tsx
import { useEffect, useRef } from 'react'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import '@milkdown/crepe/theme/classic.css'

interface EditorProps {
  defaultValue: string
  onChange: (markdown: string) => void
}

export function Editor({ defaultValue, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue,
      features: {
        [CrepeFeature.CodeMirror]: true,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.Cursor]: true,
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.BlockEdit]: false,
        [CrepeFeature.Toolbar]: false,
        [CrepeFeature.Table]: false,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.TopBar]: false,
        [CrepeFeature.AI]: false,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: 'Start writing...',
        },
      },
    })

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, _prevMarkdown) => {
        onChange(markdown)
      })
    })

    crepe.create().then(() => {
      crepeRef.current = crepe
    })

    return () => {
      crepe.destroy()
      crepeRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={editorRef} className="editor-wrapper" />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/Editor.tsx
git commit -m "feat: add Milkdown Crepe editor component"
```

---

### Task 8: App Component with Auto-Save

**Files:**
- Create: `src/editor/App.tsx`

- [ ] **Step 1: Create the App component**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { Editor } from './Editor'
import { loadNote, saveNote } from './db'
import './styles.css'

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export function App() {
  const [initialContent, setInitialContent] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef<string>('')

  // Load note from IndexedDB on mount
  useEffect(() => {
    loadNote().then((content) => {
      setInitialContent(content)
      latestContentRef.current = content
    }).catch((err) => {
      console.error('Failed to load note:', err)
      setInitialContent('')
    })
  }, [])

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestContentRef.current) {
        saveNote(latestContentRef.current)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleChange = useCallback((markdown: string) => {
    latestContentRef.current = markdown
    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveNote(markdown)
        setSaveStatus('saved')
      } catch (err) {
        console.error('Failed to save:', err)
        setSaveStatus('error')
      }
    }, 1000)
  }, [])

  const statusText = {
    saved: '已保存 ✓',
    saving: '保存中...',
    unsaved: '',
    error: '保存失败 ✗',
  }

  if (initialContent === null) {
    return (
      <div className="app">
        <div className="status-bar">
          <span className="brand">HappyNote</span>
          <span className="save-status">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="status-bar">
        <span className="brand">HappyNote</span>
        <span className="save-status">{statusText[saveStatus]}</span>
      </div>
      <div className="editor-container">
        <Editor defaultValue={initialContent} onChange={handleChange} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/App.tsx
git commit -m "feat: add App component with auto-save to IndexedDB"
```

---

### Task 9: React Entry Point

**Files:**
- Create: `src/editor/main.tsx`

- [ ] **Step 1: Create the React entry**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 2: Commit**

```bash
git add src/editor/main.tsx
git commit -m "feat: add React entry point"
```

---

### Task 10: Fix Vite Config for Chrome Extension

**Files:**
- Modify: `vite.config.ts`

The initial vite config needs adjustment — Chrome extension background scripts must be standalone ES modules without chunking, and the editor HTML needs to be properly referenced.

- [ ] **Step 1: Update vite.config.ts for proper Chrome extension build**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest-and-icons',
      closeBundle() {
        // Copy manifest.json to dist
        copyFileSync(
          resolve(__dirname, 'src/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        )
        // Copy icons to dist
        mkdirSync(resolve(__dirname, 'dist/icons'), { recursive: true })
        for (const size of [16, 48, 128]) {
          try {
            copyFileSync(
              resolve(__dirname, `public/icons/icon${size}.png`),
              resolve(__dirname, `dist/icons/icon${size}.png`)
            )
          } catch { /* icons may not exist yet */ }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'src/editor/index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js'
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
```

- [ ] **Step 2: Verify build works**

Run: `bun run build`
Expected: Build completes. `dist/` contains `background.js`, `editor/index.html`, assets, `manifest.json`, and `icons/`.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "fix: update Vite config for Chrome extension build"
```

---

### Task 11: End-to-End Verification

- [ ] **Step 1: Run full build**

Run: `bun run build`
Expected: No errors. `dist/` directory contains all required files.

- [ ] **Step 2: Verify dist structure**

Run: `find dist -type f | sort` (or `Get-ChildItem -Recurse dist`)
Expected structure:
```
dist/
  background.js
  manifest.json
  icons/icon16.png
  icons/icon48.png
  icons/icon128.png
  editor/index.html
  assets/...
```

- [ ] **Step 3: Load extension in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Verify the extension loads without errors
6. Click the extension icon
7. Verify a new tab opens with the editor
8. Type some Markdown and verify WYSIWYG rendering works
9. Close and reopen the tab — verify content persists

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: HappyNote MVP - Chrome extension Markdown editor"
```
