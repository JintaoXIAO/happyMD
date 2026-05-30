import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, type EditorHandle } from './Editor';
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  migrateIfNeeded,
  saveNote,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './db';
import type { NoteRecord, Settings } from './db';
import { SettingsPanel } from './SettingsPanel';
import { TableInsertButton } from './TableInsertButton';
import { LatexPanel } from './LatexPanel';
import { CommandPalette } from './CommandPalette';
import { TableOfContents, type TocItem } from './TableOfContents';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tocVisible, setTocVisible] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

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

        // If no notes exist, create a welcome note
        if (noteList.length === 0) {
          const welcome = await createNote('# Welcome to HappyNote\n\nStart typing here...');
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
      } catch (err) {
        console.error('Failed to init:', err);
        setInitialContent('# Welcome to HappyNote\n\nStart typing here...');
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
    setSaveStatus('saved');

    // Refresh list for updated times
    const updatedList = await listNotes();
    setNotes(updatedList);
  }, []);

  // Create a new note
  const handleCreateNote = useCallback(async () => {
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

  // Delete a note
  const handleDeleteNote = useCallback(async (id: string) => {
    // Don't delete the last note
    if (notes.length <= 1) return;

    if (!confirm('确定删除这篇笔记？')) return;

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
  }, [notes.length]);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings).catch((err) => {
      console.error('Failed to save settings:', err);
    });
  }, []);

  const statusText: Record<SaveStatus, string> = {
    saved: '✓ 已保存',
    saving: '保存中...',
    unsaved: '',
    error: '✗ 保存失败',
  };

  if (initialContent === null) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-center h-full text-sm text-gray-400">
          加载中...
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
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onClose={() => setPaletteOpen(false)}
      />

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
        {/* Table of Contents */}
        <TableOfContents
          visible={tocVisible}
          items={tocItems}
          activePos={null}
          onItemClick={(pos) => editorHandleRef.current?.scrollToPos(pos)}
        />
      </div>

      {/* Bottom toolbar + status bar */}
      <div className="flex justify-between items-center px-4 py-1.5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 shrink-0 bg-white dark:bg-[#1a1a1a] relative z-10">
        {/* Left: tools */}
        <div className="flex items-center gap-1">
          {/* New note */}
          <button
            onClick={() => { handleCreateNote(); }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="新建笔记"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {/* Search / Command Palette toggle */}
          <button
            onClick={() => setPaletteOpen((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="搜索笔记"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
          <TableInsertButton onInsert={(row, col) => editorHandleRef.current?.insertTable(row, col)} />
          <LatexPanel onInsert={(latex, block) => editorHandleRef.current?.insertLatex(latex, block)} />
        </div>

        {/* Right: dark mode + TOC toggle + status */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => {
              const newSettings = { ...settings, darkMode: !settings.darkMode };
              setSettings(newSettings);
              saveSettings(newSettings);
            }}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-gray-700"
            title={settings.darkMode ? '切换亮色模式' : '切换暗黑模式'}
          >
            {settings.darkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
          {/* TOC toggle */}
          <button
            onClick={() => setTocVisible((v) => !v)}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${tocVisible ? 'text-gray-600' : 'text-gray-400'} hover:text-gray-600`}
            title="大纲"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>
          <span className="transition-opacity duration-300">
            {statusText[saveStatus]}
          </span>
        </div>
      </div>
    </div>
  );
}
