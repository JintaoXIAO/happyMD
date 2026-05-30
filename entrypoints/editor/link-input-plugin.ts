import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

/**
 * A ProseMirror plugin that converts `[text](url)` into a link mark
 * when the user finishes typing the closing parenthesis.
 * Mimics Typora behavior.
 */

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)$/;

const linkInputPluginKey = new PluginKey('link-input-rule');

export const linkInputRule = $prose(() => {
  return new Plugin({
    key: linkInputPluginKey,
    props: {
      handleTextInput(view: EditorView, from: number, to: number, text: string) {
        // Only trigger on closing parenthesis
        if (text !== ')') return false;

        const { state } = view;
        const { doc, schema } = state;

        // Get the text content of the current text block up to cursor + the new char
        const $pos = doc.resolve(from);
        const textBefore =
          $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\ufffc') +
          text;

        const match = LINK_PATTERN.exec(textBefore);
        if (!match) return false;

        const [fullMatch, linkText, url] = match;
        const linkMark = schema.marks.link;
        if (!linkMark) return false;

        // Calculate positions in the document
        const start = $pos.start(); // start of parent node content
        const matchStartInParent = textBefore.length - fullMatch.length;
        const matchStart = start + matchStartInParent;
        const matchEnd = from + 1; // include the `)` we're about to type

        // Create the transaction
        const tr = state.tr;
        // Delete the full markdown link syntax
        tr.delete(matchStart, from);
        // Insert just the link text with link mark at matchStart
        const mark = linkMark.create({ href: url });
        tr.insert(matchStart, schema.text(linkText, [mark]));

        view.dispatch(tr);
        return true;
      },
    },
  });
});
