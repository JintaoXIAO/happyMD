import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractTitle,
  createNote,
  getNote,
  saveNote,
  deleteNote,
  listNotes,
  clearAllNotes,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from '../entrypoints/editor/db';

describe('extractTitle', () => {
  it('extracts title from a heading', () => {
    expect(extractTitle('# Hello World\n\nsome content')).toBe('Hello World');
  });

  it('extracts title from heading with extra spaces', () => {
    expect(extractTitle('#   Spaced Title  \n')).toBe('Spaced Title');
  });

  it('uses first line if no heading found', () => {
    expect(extractTitle('Just some text\nSecond line')).toBe('Just some text');
  });

  it('truncates long first lines to 50 chars', () => {
    const longLine = 'A'.repeat(100);
    expect(extractTitle(longLine)).toBe('A'.repeat(50));
  });

  it('returns default for empty content', () => {
    expect(extractTitle('')).toBe('Untitled Note');
  });

  it('returns default for whitespace only', () => {
    expect(extractTitle('   \n\n  ')).toBe('Untitled Note');
  });

  it('picks the first heading even if not on line 1', () => {
    expect(extractTitle('some text\n# Real Title\nmore')).toBe('Real Title');
  });
});

describe('IndexedDB CRUD', () => {
  beforeEach(async () => {
    await clearAllNotes();
  });

  describe('createNote', () => {
    it('creates a note with default empty content', async () => {
      const note = await createNote('');
      expect(note.id).toBeTruthy();
      expect(note.content).toBe('');
      expect(note.title).toBe('Untitled Note');
      expect(note.createdAt).toBeGreaterThan(0);
      expect(note.updatedAt).toBeGreaterThan(0);
    });

    it('creates a note with content and extracts title', async () => {
      const note = await createNote('# My Note\n\nBody text');
      expect(note.title).toBe('My Note');
      expect(note.content).toBe('# My Note\n\nBody text');
    });

    it('generates unique IDs', async () => {
      const note1 = await createNote('one');
      const note2 = await createNote('two');
      expect(note1.id).not.toBe(note2.id);
    });
  });

  describe('getNote', () => {
    it('retrieves an existing note', async () => {
      const created = await createNote('# Test');
      const retrieved = await getNote(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.content).toBe('# Test');
    });

    it('returns undefined for non-existent note', async () => {
      const result = await getNote('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('saveNote', () => {
    it('updates content and title', async () => {
      const note = await createNote('# Original');
      await saveNote(note.id, '# Updated Title\n\nNew content');

      const updated = await getNote(note.id);
      expect(updated!.content).toBe('# Updated Title\n\nNew content');
      expect(updated!.title).toBe('Updated Title');
    });

    it('updates updatedAt timestamp', async () => {
      const note = await createNote('# Test');
      const originalTime = note.updatedAt;

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));
      await saveNote(note.id, '# Modified');

      const updated = await getNote(note.id);
      expect(updated!.updatedAt).toBeGreaterThan(originalTime);
    });

    it('does nothing for non-existent note', async () => {
      // Should not throw
      await saveNote('fake-id', 'content');
    });
  });

  describe('deleteNote', () => {
    it('removes a note', async () => {
      const note = await createNote('# To Delete');
      await deleteNote(note.id);

      const result = await getNote(note.id);
      expect(result).toBeUndefined();
    });
  });

  describe('listNotes', () => {
    it('returns empty list initially', async () => {
      const notes = await listNotes();
      expect(notes).toHaveLength(0);
    });

    it('returns all notes sorted by updatedAt descending', async () => {
      const note1 = await createNote('# First');
      await new Promise((r) => setTimeout(r, 10));
      const note2 = await createNote('# Second');
      await new Promise((r) => setTimeout(r, 10));
      const note3 = await createNote('# Third');

      const notes = await listNotes();
      expect(notes).toHaveLength(3);
      expect(notes[0].id).toBe(note3.id);
      expect(notes[1].id).toBe(note2.id);
      expect(notes[2].id).toBe(note1.id);
    });

    it('reflects updates in sort order', async () => {
      const note1 = await createNote('# First');
      await new Promise((r) => setTimeout(r, 10));
      await createNote('# Second');
      await new Promise((r) => setTimeout(r, 10));

      // Update the first note - should now be most recent
      await saveNote(note1.id, '# First Updated');

      const notes = await listNotes();
      expect(notes[0].id).toBe(note1.id);
    });
  });

  describe('clearAllNotes', () => {
    it('removes all notes', async () => {
      await createNote('# One');
      await createNote('# Two');
      await createNote('# Three');

      await clearAllNotes();
      const notes = await listNotes();
      expect(notes).toHaveLength(0);
    });
  });
});

describe('Settings', () => {
  beforeEach(async () => {
    // Clear by saving defaults
    await saveSettings(DEFAULT_SETTINGS);
  });

  it('returns default settings when none saved', async () => {
    const settings = await loadSettings();
    expect(settings.fontFamily).toBe('system-ui');
    expect(settings.codeFontFamily).toBe('ui-monospace, monospace');
    expect(settings.fontSize).toBe(16);
    expect(settings.codeFontSize).toBe(14);
    expect(settings.darkMode).toBe(false);
  });

  it('persists and loads custom settings', async () => {
    await saveSettings({
      fontFamily: '"Fira Code"',
      codeFontFamily: '"JetBrains Mono"',
      fontSize: 18,
      codeFontSize: 16,
      darkMode: true,
    });

    const loaded = await loadSettings();
    expect(loaded.fontFamily).toBe('"Fira Code"');
    expect(loaded.codeFontFamily).toBe('"JetBrains Mono"');
    expect(loaded.fontSize).toBe(18);
    expect(loaded.codeFontSize).toBe(16);
    expect(loaded.darkMode).toBe(true);
  });
});
