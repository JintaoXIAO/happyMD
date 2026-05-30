import { openDB, type IDBPDatabase } from 'idb';

interface NoteRecord {
  id: string;
  content: string;
  updatedAt: number;
}

export interface Settings {
  fontFamily: string;
  codeFontFamily: string;
  fontSize: number;
  codeFontSize: number;
}

interface HappyNoteDB {
  notes: {
    key: string;
    value: NoteRecord;
  };
  settings: {
    key: string;
    value: { id: string } & Settings;
  };
}

const DB_NAME = 'happynote';
const DB_VERSION = 2;
const NOTES_STORE = 'notes';
const SETTINGS_STORE = 'settings';
const DEFAULT_NOTE_ID = 'default';
const SETTINGS_ID = 'user';

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: 'system-ui',
  codeFontFamily: 'ui-monospace, monospace',
  fontSize: 16,
  codeFontSize: 14,
};

let dbPromise: Promise<IDBPDatabase<HappyNoteDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HappyNoteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HappyNoteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadNote(): Promise<string> {
  const db = await getDB();
  const record = await db.get(NOTES_STORE, DEFAULT_NOTE_ID);
  return record?.content ?? '';
}

export async function saveNote(content: string): Promise<void> {
  const db = await getDB();
  await db.put(NOTES_STORE, {
    id: DEFAULT_NOTE_ID,
    content,
    updatedAt: Date.now(),
  });
}

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const record = await db.get(SETTINGS_STORE, SETTINGS_ID);
  if (!record) return DEFAULT_SETTINGS;
  return {
    fontFamily: record.fontFamily || DEFAULT_SETTINGS.fontFamily,
    codeFontFamily: record.codeFontFamily || DEFAULT_SETTINGS.codeFontFamily,
    fontSize: record.fontSize || DEFAULT_SETTINGS.fontSize,
    codeFontSize: record.codeFontSize || DEFAULT_SETTINGS.codeFontSize,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { id: SETTINGS_ID, ...settings });
}
