import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from './i18n';
import { Editor, type EditorHandle } from './Editor';
import {
  createNote,
  deleteNote,
  clearAllNotes,
  getNote,
  listNotes,
  migrateIfNeeded,
  saveNote,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './db';
import type { NoteRecord, Settings } from './db';
import { WELCOME_CONTENT } from './welcome';
import { CommandPalette } from './CommandPalette';
import { TableOfContents, type TocItem } from './TableOfContents';
import { ShortcutsPanel } from './ShortcutsPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { exportNoteAsZip, exportAllAsZip, exportAsPDF } from './export';
import { markdownToHtml } from './CopyButton';
import { ContextMenu } from './ContextMenu';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tocVisible, setTocVisible] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Multi-document state
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [initialContent, setInitialContent] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>('');
  const activeNoteIdRef = useRef<string | null>(null);
  const editorHandleRef = useRef<EditorHandle>(null);

  // Keep ref in sync
  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  // Initial load: migrate old data, load note list, load settings
  useEffect(() => {
    async function init() {
      try {
        const [savedSettings] = await Promise.all([loadSettings()]);
        setSettings(savedSettings);

        const migratedId = await migrateIfNeeded();
        let noteList = await listNotes();

        // If no notes exist, create a welcome note with help content
        if (noteList.length === 0) {
          const welcome = await createNote(WELCOME_CONTENT);
          noteList = [welcome];
        }

        setNotes(noteList);

        // Determine which note to open
        const targetId = migratedId || noteList[0].id;
        setActiveNoteId(targetId);

        const note = await getNote(targetId);
        const content = note?.content ?? '';
        setInitialContent(content);
        latestContentRef.current = content;
        setCharCount(content.trim().length);
      } catch (err) {
        console.error('Failed to init:', err);
        setInitialContent(WELCOME_CONTENT);
      }
    }
    init();
  }, []);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeNoteIdRef.current && latestContentRef.current) {
        saveNote(activeNoteIdRef.current, latestContentRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Auto-save with debounce
  const handleChange = useCallback((markdown: string) => {
    latestContentRef.current = markdown;
    setCharCount(markdown.trim().length);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const noteId = activeNoteIdRef.current;
      if (!noteId) return;

      setSaveStatus('saving');
      try {
        await saveNote(noteId, markdown);
        setSaveStatus('saved');
        // Update note in list (title/time may have changed)
        const updatedList = await listNotes();
        setNotes(updatedList);
      } catch (err) {
        console.error('Failed to save:', err);
        setSaveStatus('error');
      }
    }, 1000);
  }, []);

  // Switch to a different note
  const handleSelectNote = useCallback(async (id: string) => {
    if (id === activeNoteIdRef.current) return;

    // Save current note first
    if (activeNoteIdRef.current && latestContentRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      await saveNote(activeNoteIdRef.current, latestContentRef.current);
    }

    // Load the target note
    const note = await getNote(id);
    if (!note) return;

    setActiveNoteId(id);
    setInitialContent(note.content);
    latestContentRef.current = note.content;
    setCharCount(note.content.trim().length);
    setSaveStatus('saved');

    // Refresh list for updated times
    const updatedList = await listNotes();
    setNotes(updatedList);
  }, []);

  // Create a new note
  const handleCreateNote = useCallback(async () => {
    // If current note is empty, don't create another one
    if (!latestContentRef.current.trim()) return;

    // Save current note first
    if (activeNoteIdRef.current && latestContentRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      await saveNote(activeNoteIdRef.current, latestContentRef.current);
    }

    const newNote = await createNote('');
    const updatedList = await listNotes();
    setNotes(updatedList);
    setActiveNoteId(newNote.id);
    setInitialContent(newNote.content);
    latestContentRef.current = newNote.content;
    setSaveStatus('saved');
  }, []);

  // Global keyboard shortcuts (Alt+key to avoid browser conflicts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.shiftKey) return;

      switch (e.key) {
        case 't': // Alt+T: New note
          e.preventDefault();
          handleCreateNote();
          break;
        case 'p': // Alt+P: Command Palette
          e.preventDefault();
          setPaletteOpen((v) => !v);
          break;
        case 'l': // Alt+L: Toggle TOC
          e.preventDefault();
          setTocVisible((v) => !v);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  // Custom right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Always update position (closes and reopens if already shown)
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Delete a note
  const handleDeleteNote = useCallback((id: string) => {
    // Don't delete the last note
    if (notes.length <= 1) return;
    setDeleteConfirmId(id);
  }, [notes.length]);

  const confirmDeleteNote = useCallback(async () => {
    const id = deleteConfirmId;
    if (!id) return;
    setDeleteConfirmId(null);

    await deleteNote(id);
    const updatedList = await listNotes();
    setNotes(updatedList);

    // If we deleted the active note, switch to the first remaining
    if (id === activeNoteIdRef.current) {
      const next = updatedList[0];
      if (next) {
        setActiveNoteId(next.id);
        setInitialContent(next.content);
        latestContentRef.current = next.content;
      }
    }
    setSaveStatus('saved');
  }, [deleteConfirmId]);

  // Clear all notes
  const handleClearAll = useCallback(() => {
    setClearAllConfirm(true);
  }, []);

  const confirmClearAll = useCallback(async () => {
    setClearAllConfirm(false);
    await clearAllNotes();
    // Create a fresh welcome note
    const welcome = await createNote('');
    const updatedList = await listNotes();
    setNotes(updatedList);
    setActiveNoteId(welcome.id);
    setInitialContent(welcome.content);
    latestContentRef.current = welcome.content;
    setSaveStatus('saved');
  }, []);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings).catch((err) => {
      console.error('Failed to save settings:', err);
    });
  }, []);

  // Paste from clipboard into editor
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && editorHandleRef.current) {
        editorHandleRef.current.insertMarkdown(text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  }, []);

  const statusText: Record<SaveStatus, string> = {
    saved: t('app.saved'),
    saving: t('app.saving'),
    unsaved: '',
    error: t('app.saveError'),
  };

  if (initialContent === null) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-center h-full text-sm text-gray-400">
          {t('app.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${settings.darkMode ? 'dark' : ''}`}>
      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        notes={notes}
        activeNoteId={activeNoteId}
        settings={settings}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onClose={() => setPaletteOpen(false)}
        onSettingsChange={handleSettingsChange}
        onCopyMarkdown={() => {
          const md = latestContentRef.current;
          if (md.trim()) navigator.clipboard.writeText(md);
        }}
        onCopyRichText={() => {
          const md = latestContentRef.current;
          if (md.trim()) {
            const html = markdownToHtml(md);
            navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([md], { type: 'text/plain' }),
              }),
            ]);
          }
        }}
        onToggleDarkMode={() => {
          const newSettings = { ...settings, darkMode: !settings.darkMode };
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        onExportZip={() => { if (activeNoteId) exportNoteAsZip(activeNoteId); }}
        onExportAll={() => exportAllAsZip()}
        onExportPDF={() => exportAsPDF()}
      />

      {/* Shortcuts Panel */}
      <ShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        title={t('confirm.delete.title')}
        message={t('confirm.delete.message')}
        confirmText={t('confirm.delete.confirm')}
        cancelText={t('confirm.delete.cancel')}
        danger
        onConfirm={confirmDeleteNote}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Clear All Confirmation */}
      <ConfirmDialog
        open={clearAllConfirm}
        title={t('confirm.clearAll.title')}
        message={t('confirm.clearAll.message')}
        confirmText={t('confirm.clearAll.confirm')}
        cancelText={t('confirm.clearAll.cancel')}
        danger
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllConfirm(false)}
      />

      {/* Custom Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          getMarkdown={() => latestContentRef.current}
          onPaste={handlePaste}
        />
      )}

      {/* Editor area + TOC */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div
            className="w-full max-w-4xl"
            style={{
              '--user-font': settings.fontFamily,
              '--user-code-font': settings.codeFontFamily,
              '--user-font-size': `${settings.fontSize}px`,
              '--user-code-font-size': `${settings.codeFontSize}px`,
            } as React.CSSProperties}
          >
            <Editor
              key={activeNoteId}
              ref={editorHandleRef}
              noteId={activeNoteId || ''}
              defaultValue={initialContent}
              onChange={handleChange}
              onTocUpdate={setTocItems}
            />
          </div>
        </div>
      </div>

      {/* Table of Contents - floating */}
      <TableOfContents
        visible={tocVisible}
        items={tocItems}
        activePos={null}
        onItemClick={(pos) => editorHandleRef.current?.scrollToPos(pos)}
        onClose={() => setTocVisible(false)}
      />

      {/* Bottom status bar */}
      <div className="flex justify-between items-center px-4 py-1 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 shrink-0 bg-white dark:bg-[#1a1a1a] relative z-10">
        <span>{charCount > 0 ? `${charCount} ${t('status.chars')}` : ''}</span>
        <span className="transition-opacity duration-300">
          {statusText[saveStatus]}
        </span>
      </div>
    </div>
  );
}
