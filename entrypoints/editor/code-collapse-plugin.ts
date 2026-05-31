import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { t } from './i18n';

const codeBlockCollapseKey = new PluginKey('code-block-collapse');

export const codeBlockCollapsePlugin = $prose(() => {
  // Track collapsed state per code block position
  const collapsedBlocks = new Set<number>();
  let editorView: EditorView | null = null;

  function triggerUpdate() {
    if (editorView) {
      editorView.dispatch(editorView.state.tr.setMeta(codeBlockCollapseKey, true));
    }
  }

  function buildDecorations(doc: any): DecorationSet {
    const decorations: Decoration[] = [];

    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'code_block') {
        const isCollapsed = collapsedBlocks.has(pos);

        // Add collapse button widget before the code block
        const widget = Decoration.widget(pos, () => {
          const btn = document.createElement('button');
          btn.className = `code-collapse-btn ${isCollapsed ? 'collapsed' : ''}`;
          btn.textContent = isCollapsed ? t('code.expand') : t('code.collapse');
          btn.title = isCollapsed ? t('code.expandTitle') : t('code.collapseTitle');
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isCollapsed) {
              collapsedBlocks.delete(pos);
            } else {
              collapsedBlocks.add(pos);
            }
            triggerUpdate();
          });
          return btn;
        }, { side: -1 });

        decorations.push(widget);

        // If collapsed, add a node decoration to hide the content
        if (isCollapsed) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: 'code-block-collapsed',
            })
          );
        }
      }
    });

    return DecorationSet.create(doc, decorations);
  }

  return new Plugin({
    key: codeBlockCollapseKey,
    view(view) {
      editorView = view;
      return {
        destroy() {
          editorView = null;
        },
      };
    },
    state: {
      init(_, state) {
        return buildDecorations(state.doc);
      },
      apply(tr, old, _oldState, newState) {
        if (tr.docChanged || tr.getMeta(codeBlockCollapseKey)) {
          // On collapse toggle or doc change, recalc positions
          if (tr.docChanged) {
            // Clear collapsed set on doc change (positions shift)
            collapsedBlocks.clear();
          }
          return buildDecorations(newState.doc);
        }
        return old;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
});
