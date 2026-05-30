import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { callCommand, insert } from '@milkdown/kit/utils';
import { editorViewCtx, schemaCtx } from '@milkdown/kit/core';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { linkInputRule } from './link-input-plugin';
import { codeBlockCollapsePlugin } from './code-collapse-plugin';
import { saveImage, getImage, IMAGE_URL_PREFIX } from './db';
import type { TocItem } from './TableOfContents';

interface EditorProps {
  defaultValue: string;
  noteId: string;
  onChange: (markdown: string) => void;
  onTocUpdate?: (items: TocItem[]) => void;
}

export interface EditorHandle {
  insertTable: (row: number, col: number) => void;
  insertLatex: (latex: string, block?: boolean) => void;
  getHeadings: () => TocItem[];
  scrollToPos: (pos: number) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({ defaultValue, noteId, onChange, onTocUpdate }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  // Cache object URLs for cleanup
  const objectURLsRef = useRef<Map<string, string>>(new Map());

  function extractHeadings(): TocItem[] {
    if (!crepeRef.current) return [];
    const items: TocItem[] = [];
    crepeRef.current.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const doc = view.state.doc;
      doc.forEach((node, offset) => {
        if (node.type.name === 'heading') {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos: offset,
          });
        }
      });
    });
    return items;
  }

  useImperativeHandle(ref, () => ({
    insertTable(row: number, col: number) {
      if (crepeRef.current) {
        crepeRef.current.editor.action(callCommand(insertTableCommand.key, { row, col }));
      }
    },
    insertLatex(latex: string, block = false) {
      if (!crepeRef.current) return;
      if (block) {
        crepeRef.current.editor.action(insert(`$$\n${latex || ' '}\n$$`, false));
      } else {
        crepeRef.current.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const schema = ctx.get(schemaCtx);
          const mathType = schema.nodes['math_inline'];
          if (mathType) {
            const node = mathType.create({ value: latex });
            const tr = view.state.tr.replaceSelectionWith(node);
            view.dispatch(tr.scrollIntoView());
          }
        });
      }
    },
    getHeadings() {
      return extractHeadings();
    },
    scrollToPos(pos: number) {
      if (!crepeRef.current) return;
      crepeRef.current.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const tr = view.state.tr.setSelection(
          view.state.selection.constructor.near(view.state.doc.resolve(pos))
        );
        view.dispatch(tr.scrollIntoView());
        view.focus();
      });
    },
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: defaultValue || '',
      features: {
        [CrepeFeature.CodeMirror]: true,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.Cursor]: true,
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.BlockEdit]: false,
        [CrepeFeature.Toolbar]: false,
        [CrepeFeature.Table]: true,
        [CrepeFeature.Latex]: true,
        [CrepeFeature.TopBar]: false,
        [CrepeFeature.AI]: false,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: '开始写点什么...',
        },
        [CrepeFeature.ImageBlock]: {
          onUpload: async (file: File) => {
            // Save image to IndexedDB and return persistent URL
            const url = await saveImage(noteId, file, file.type);
            return url;
          },
          proxyDomURL: async (url: string) => {
            // Convert happynote://img/{id} to object URL for rendering
            if (!url.startsWith(IMAGE_URL_PREFIX)) return url;
            const imgId = url.slice(IMAGE_URL_PREFIX.length);

            // Check cache first
            const cached = objectURLsRef.current.get(imgId);
            if (cached) return cached;

            // Load from IndexedDB
            const record = await getImage(imgId);
            if (!record) return url;

            const objectURL = URL.createObjectURL(record.blob);
            objectURLsRef.current.set(imgId, objectURL);
            return objectURL;
          },
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, _prevMarkdown) => {
        onChange(markdown);
        // Update TOC after content change
        if (onTocUpdate) {
          setTimeout(() => {
            const headings = extractHeadings();
            onTocUpdate(headings);
          }, 0);
        }
      });
    });

    // Register custom plugins
    crepe.editor.use(linkInputRule);
    crepe.editor.use(codeBlockCollapsePlugin);

    crepe.create().then(() => {
      crepeRef.current = crepe;
      console.log('[HappyNote] Editor created successfully');
      // Emit initial TOC
      if (onTocUpdate) {
        const headings = extractHeadings();
        onTocUpdate(headings);
      }
    }).catch((err) => {
      console.error('[HappyNote] Failed to create editor:', err);
    });

    return () => {
      crepe.destroy();
      crepeRef.current = null;
      // Revoke all object URLs
      for (const url of objectURLsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      objectURLsRef.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={editorRef} className="min-h-full" />;
});
