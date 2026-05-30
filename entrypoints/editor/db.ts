import { openDB, type IDBPDatabase } from 'idb';

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ImageRecord {
  id: string;
  noteId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface Settings {
  fontFamily: string;
  codeFontFamily: string;
  fontSize: number;
  codeFontSize: number;
  darkMode: boolean;
}

interface HappyNoteDB {
  notes: {
    key: string;
    value: NoteRecord;
  };
  images: {
    key: string;
    value: ImageRecord;
    indexes: { 'by-note': string };
  };
  settings: {
    key: string;
    value: { id: string } & Settings;
  };
}

const DB_NAME = 'happynote';
const DB_VERSION = 4;
const NOTES_STORE = 'notes';
const IMAGES_STORE = 'images';
const SETTINGS_STORE = 'settings';
const SETTINGS_ID = 'user';

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: 'system-ui',
  codeFontFamily: 'ui-monospace, monospace',
  fontSize: 16,
  codeFontSize: 14,
  darkMode: false,
};

let dbPromise: Promise<IDBPDatabase<HappyNoteDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HappyNoteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HappyNoteDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
          }
        }
        // version 3 was a no-op fix
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains(IMAGES_STORE)) {
            const imgStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
            imgStore.createIndex('by-note', 'noteId');
          } else {
            const imgStore = transaction.objectStore(IMAGES_STORE);
            if (!imgStore.indexNames.contains('by-note')) {
              imgStore.createIndex('by-note', 'noteId');
            }
          }
        }
      },
    });
  }
  return dbPromise;
}

// --- Note CRUD ---

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Extract title from markdown content (first heading or first line) */
export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const firstLine = content.trim().split('\n')[0]?.trim();
  if (firstLine) return firstLine.slice(0, 50);
  return '无标题笔记';
}

export async function createNote(content = ''): Promise<NoteRecord> {
  const db = await getDB();
  const now = Date.now();
  const note: NoteRecord = {
    id: generateId(),
    title: extractTitle(content) || '无标题笔记',
    content,
    createdAt: now,
    updatedAt: now,
  };
  await db.put(NOTES_STORE, note);
  return note;
}

export async function getNote(id: string): Promise<NoteRecord | undefined> {
  const db = await getDB();
  return db.get(NOTES_STORE, id);
}

export async function saveNote(id: string, content: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(NOTES_STORE, id);
  if (!existing) return;
  await db.put(NOTES_STORE, {
    ...existing,
    content,
    title: extractTitle(content),
    updatedAt: Date.now(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  // Delete associated images first
  await deleteImagesByNote(id);
  await db.delete(NOTES_STORE, id);
}

export async function clearAllNotes(): Promise<void> {
  const db = await getDB();
  await db.clear(NOTES_STORE);
  await db.clear(IMAGES_STORE);
}

export async function listNotes(): Promise<NoteRecord[]> {
  const db = await getDB();
  const notes = await db.getAll(NOTES_STORE);
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Migrate old single-note data to new multi-note format */
export async function migrateIfNeeded(): Promise<string | null> {
  const db = await getDB();
  const notes = await db.getAll(NOTES_STORE);

  const oldNote = notes.find((n) => n.id === 'default' && !n.createdAt);
  if (oldNote) {
    const now = Date.now();
    const migrated: NoteRecord = {
      id: generateId(),
      title: extractTitle(oldNote.content || ''),
      content: oldNote.content || '',
      createdAt: now,
      updatedAt: oldNote.updatedAt || now,
    };
    await db.put(NOTES_STORE, migrated);
    await db.delete(NOTES_STORE, 'default');
    return migrated.id;
  }

  if (notes.length > 0) {
    const sorted = notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return sorted[0].id;
  }
  return null;
}

// --- Image CRUD ---

export const IMAGE_URL_PREFIX = 'happynote://img/';

export async function saveImage(noteId: string, blob: Blob, mimeType: string): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: ImageRecord = {
    id,
    noteId,
    blob,
    mimeType,
    createdAt: Date.now(),
  };
  await db.put(IMAGES_STORE, record);
  return `${IMAGE_URL_PREFIX}${id}`;
}

export async function getImage(id: string): Promise<ImageRecord | undefined> {
  const db = await getDB();
  return db.get(IMAGES_STORE, id);
}

export async function deleteImagesByNote(noteId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(IMAGES_STORE, 'readwrite');
  const index = tx.store.index('by-note');
  let cursor = await index.openCursor(noteId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// --- Settings ---

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const record = await db.get(SETTINGS_STORE, SETTINGS_ID);
  if (!record) return DEFAULT_SETTINGS;
  return {
    fontFamily: record.fontFamily || DEFAULT_SETTINGS.fontFamily,
    codeFontFamily: record.codeFontFamily || DEFAULT_SETTINGS.codeFontFamily,
    fontSize: record.fontSize || DEFAULT_SETTINGS.fontSize,
    codeFontSize: record.codeFontSize || DEFAULT_SETTINGS.codeFontSize,
    darkMode: record.darkMode ?? DEFAULT_SETTINGS.darkMode,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { id: SETTINGS_ID, ...settings });
}
