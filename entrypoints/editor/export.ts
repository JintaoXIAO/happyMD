import { zipSync, strToU8 } from 'fflate';
import { getNote, listNotes, getImage, IMAGE_URL_PREFIX } from './db';
import { t } from './i18n';

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || t('note.untitled');
}

/**
 * Extract all image IDs referenced in markdown content
 */
function extractImageIds(content: string): string[] {
  const ids: string[] = [];
  const prefix = IMAGE_URL_PREFIX;
  let idx = content.indexOf(prefix);
  while (idx !== -1) {
    const start = idx + prefix.length;
    // Find end of ID (next non-alphanumeric char or end of string)
    let end = start;
    while (end < content.length && /[\w-]/.test(content[end])) end++;
    if (end > start) {
      ids.push(content.substring(start, end));
    }
    idx = content.indexOf(prefix, end);
  }
  return ids;
}

/**
 * Get mime extension from mime type
 */
function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/avif': 'avif',
  };
  return map[mimeType] || 'png';
}

/**
 * Convert a Blob to Uint8Array
 */
async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Replace image URLs in markdown with relative paths
 */
function replaceImageURLs(content: string, imageMap: Map<string, string>): string {
  let result = content;
  for (const [id, relativePath] of imageMap) {
    result = result.replaceAll(`${IMAGE_URL_PREFIX}${id}`, relativePath);
  }
  return result;
}

/**
 * Export a single note as a zip file containing .md + images/
 */
export async function exportNoteAsZip(noteId: string): Promise<void> {
  const note = await getNote(noteId);
  if (!note) return;

  const title = sanitizeFilename(note.title);
  const imageIds = extractImageIds(note.content);

  // Collect images and build path map
  const files: Record<string, Uint8Array> = {};
  const imageMap = new Map<string, string>();

  for (const imgId of imageIds) {
    const record = await getImage(imgId);
    if (!record) continue;
    const ext = mimeToExt(record.mimeType);
    const filename = `${imgId}.${ext}`;
    const relativePath = `images/${filename}`;
    imageMap.set(imgId, relativePath);
    files[relativePath] = await blobToUint8Array(record.blob);
  }

  // Replace image URLs in markdown
  const mdContent = replaceImageURLs(note.content, imageMap);
  files[`${title}.md`] = strToU8(mdContent);

  // Generate zip and trigger download
  const zipped = zipSync(files);
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), `${title}.zip`);
}

/**
 * Export all notes as a zip file
 */
export async function exportAllAsZip(): Promise<void> {
  const notes = await listNotes();
  const files: Record<string, Uint8Array> = {};
  const usedNames = new Set<string>();

  for (const noteMeta of notes) {
    const note = await getNote(noteMeta.id);
    if (!note) continue;

    // Deduplicate folder names
    let folderName = sanitizeFilename(note.title);
    if (usedNames.has(folderName)) {
      folderName = `${folderName}_${note.id}`;
    }
    usedNames.add(folderName);

    const imageIds = extractImageIds(note.content);
    const imageMap = new Map<string, string>();

    for (const imgId of imageIds) {
      const record = await getImage(imgId);
      if (!record) continue;
      const ext = mimeToExt(record.mimeType);
      const filename = `${imgId}.${ext}`;
      const relativePath = `images/${filename}`;
      imageMap.set(imgId, relativePath);
      files[`${folderName}/${relativePath}`] = await blobToUint8Array(record.blob);
    }

    const mdContent = replaceImageURLs(note.content, imageMap);
    files[`${folderName}/${folderName}.md`] = strToU8(mdContent);
  }

  // Generate date string
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const zipped = zipSync(files);
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), `happynote-${dateStr}.zip`);
}

/**
 * Export current note as PDF using window.print()
 */
export function exportAsPDF(): void {
  window.print();
}

/**
 * Helper to trigger a browser download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
