import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { callCommand } from '@milkdown/kit/utils';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { linkInputRule } from './link-input-plugin';
import { codeBlockCollapsePlugin } from './code-collapse-plugin';

interface EditorProps {
  defaultValue: string;
  onChange: (markdown: string) => void;
}

export interface EditorHandle {
  insertTable: (row: number, col: number) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({ defaultValue, onChange }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  useImperativeHandle(ref, () => ({
    insertTable(row: number, col: number) {
      if (crepeRef.current) {
        crepeRef.current.editor.action(callCommand(insertTableCommand.key, { row, col }));
      }
    },
  }));

  useEffect(() => {
    if (!editorRef.current) return;

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
        [CrepeFeature.Table]: true,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.TopBar]: false,
        [CrepeFeature.AI]: false,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: '开始写点什么...',
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, _prevMarkdown) => {
        onChange(markdown);
      });
    });

    // Register custom plugins
    crepe.editor.use(linkInputRule);
    crepe.editor.use(codeBlockCollapsePlugin);

    crepe.create().then(() => {
      crepeRef.current = crepe;
      console.log('[HappyNote] Editor created successfully');
    }).catch((err) => {
      console.error('[HappyNote] Failed to create editor:', err);
    });

    return () => {
      crepe.destroy();
      crepeRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={editorRef} className="min-h-full" />;
});
