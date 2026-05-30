import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';

/**
 * A ProseMirror plugin that detects paragraphs containing only an image URL
 * and converts them into image-block nodes.
 *
 * Works by watching transactions for newly inserted/changed paragraphs.
 */

const IMAGE_URL_PATTERN =
  /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?\S*)?$/i;

const IMAGE_HOST_PATTERNS = [
  /^https?:\/\/.*imgur\.com\/\S+/i,
  /^https?:\/\/.*unsplash\.com\/photos\/\S+/i,
  /^https?:\/\/.*\.sinaimg\.\w+\/\S+/i,
  /^https?:\/\/.*pic\.\w+\.\w+\/\S+/i,
  /^https?:\/\/img\.\S+/i,
  /^https?:\/\/\S+\/raw\/\S+/i,
];

function isImageURL(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith('http')) return false;
  if (trimmed.includes(' ') || trimmed.includes('\n')) return false;
  if (IMAGE_URL_PATTERN.test(trimmed)) return true;
  return IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(trimmed));
}

const imageURLPluginKey = new PluginKey('image-url-auto-embed');

export const imageURLPlugin = $prose(() => {
  return new Plugin({
    key: imageURLPluginKey,
    appendTransaction(transactions, _oldState, newState) {
      // Only process if there was an actual document change
      const docChanged = transactions.some((tr) => tr.docChanged);
      if (!docChanged) return null;

      const { schema, doc } = newState;
      const imageBlockType = schema.nodes['image-block'];
      if (!imageBlockType) return null;

      let tr = newState.tr;
      let modified = false;

      // Scan document for paragraphs that contain only an image URL
      doc.forEach((node, offset) => {
        if (node.type.name !== 'paragraph') return;
        if (node.childCount === 0) return;

        // Get text content - could be plain text or a link node
        const text = node.textContent.trim();
        if (!text) return;

        // Must be a single line URL (the entire paragraph content)
        if (!isImageURL(text)) return;

        // Avoid re-triggering on already-processed nodes
        // Check that the paragraph only contains text/link (not already an image)
        let hasNonTextInline = false;
        node.forEach((child) => {
          if (!child.isText && child.type.name !== 'text') {
            // Allow link marks on text nodes, but reject other inline nodes
            if (child.type.name !== 'link') {
              hasNonTextInline = true;
            }
          }
        });
        if (hasNonTextInline) return;

        const imageNode = imageBlockType.create({
          src: text,
          caption: '',
          ratio: 1,
        });

        // Account for offset shift from previous replacements
        const mappedFrom = tr.mapping.map(offset);
        const mappedTo = tr.mapping.map(offset + node.nodeSize);
        tr = tr.replaceWith(mappedFrom, mappedTo, imageNode);
        modified = true;
      });

      return modified ? tr : null;
    },
  });
});
