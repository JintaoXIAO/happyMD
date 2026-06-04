export const WELCOME_CONTENT = `# Welcome to HappyNote 🎉

HappyNote is a lightweight, elegant Markdown editor that lives in your browser. It offers a Typora-like WYSIWYG experience — all your data is stored locally with no login or internet required.

---

## Getting Started

Just start typing here. HappyNote supports standard Markdown syntax and renders it as rich text in real time.

### Basic Formatting

| Syntax | Result |
|--------|--------|
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`~~strikethrough~~\` | ~~strikethrough~~ |
| \`\\\`inline code\\\`\` | \`inline code\` |
| \`[link](url)\` | [link](https://example.com) |

### Headings

Use \`#\` to create headings (levels 1–6):

\`\`\`
# Heading 1
## Heading 2
### Heading 3
\`\`\`

### Lists

Unordered lists use \`-\` or \`*\`:

- First item
- Second item
  - Nested item

Ordered lists use numbers:

1. Step one
2. Step two
3. Step three

### Blockquotes

> Use \`>\` to create a blockquote — great for highlighting important notes.

### Code Blocks

Use triple backticks for code blocks with syntax highlighting:

\`\`\`javascript
function hello() {
  console.log("Hello, HappyNote!");
}
\`\`\`

Code blocks support **collapse/expand** — look for the toggle button on long blocks.

### Horizontal Rule

Use \`---\` to insert a divider.

---

## Keyboard Shortcuts

HappyNote provides keyboard shortcuts to speed up your writing:

| Shortcut | Action |
|----------|--------|
| \`Ctrl+N\` | New note |
| \`Ctrl+P\` | Search / switch notes |
| \`Ctrl+L\` | Toggle table of contents |
| \`Ctrl+D\` | Toggle dark mode |
| \`Ctrl+,\` | Open settings |
| \`Ctrl+?\` | Show shortcut help |
| \`Ctrl+B\` | Bold |
| \`Ctrl+I\` | Italic |
| \`Ctrl+Z\` | Undo |
| \`Ctrl+Shift+Z\` | Redo |
| \`Ctrl+Shift+C\` | Copy as Markdown |

---

## Command Palette

Press \`Ctrl+P\` to open the command palette:

- **Search notes**: Type keywords to quickly find and switch between notes
- **Run commands**: Type \`>\` to enter command mode for formatting, exporting, etc.
- **Insert formats**: Type \`/\` to quickly insert headings, lists, code blocks, quotes, and more

The icon bar at the bottom provides one-click quick actions.

---

## Multi-Document Management

- Press \`Ctrl+N\` to create a new note
- Press \`Ctrl+P\` to search and switch between notes
- Notes are auto-saved — no need to save manually when switching
- Hover over a note in the command palette to reveal the delete button

---

## Tables

Insert tables via the command palette (type \`>\` then select "Insert Table"), or use Markdown syntax:

\`\`\`
| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|
| A     | B     | C     |
\`\`\`

---

## Math Formulas

HappyNote supports LaTeX math expressions. Insert formulas via the command palette with built-in templates:

- Greek letters: $\\alpha$, $\\beta$, $\\gamma$
- Fractions: $\\frac{a}{b}$
- Summation: $\\sum_{i=1}^{n} x_i$
- Integrals: $\\int_0^\\infty e^{-x} dx$

Block-level formula:

$$
E = mc^2
$$

---

## Images

Paste images directly from your clipboard — they'll be stored in local browser storage with no external hosting needed.

---

## Table of Contents

Press \`Ctrl+L\` to open the outline panel on the right. It automatically extracts the heading structure from your document. Click any heading to jump to that section.

---

## Export

HappyNote supports multiple export options:

- **Export as ZIP**: Package the current note (Markdown + images) as a ZIP file
- **Export as PDF**: Print or save the current note as a PDF
- **Export all**: Package all notes into a single ZIP file

Access these via the command palette icons or \`>\` command mode.

---

## Customization

Press \`Ctrl+,\` to open the settings panel:

- **Text font**: Choose from any system-installed font
- **Code font**: Set a separate monospace font for code blocks
- **Font size**: Adjust between 12–24px with a slider
- **Dark mode**: Toggle with \`Ctrl+D\`

---

## Context Menu

Right-click anywhere in the editor to quickly:

- Copy as Markdown source
- Copy as rich text (paste into emails, docs, etc. with formatting preserved)
- Paste from clipboard

---

## Tips

1. All notes are auto-saved locally in your browser — closing the tab won't lose your work
2. Press \`Alt+N\` from any page to quickly open HappyNote
3. The status bar at the bottom shows character count and save status
4. Periodically use "Export All" to back up your notes

---

Happy writing! Feel free to delete this document or keep it as a reference. Press \`Ctrl+N\` to create your first note.
`;
