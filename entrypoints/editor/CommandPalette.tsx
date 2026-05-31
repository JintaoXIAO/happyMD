import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NoteRecord, Settings } from './db';
import { t } from './i18n';

interface FontInfo {
  family: string;
  fullName: string;
  style: string;
}

type FontTarget = 'fontFamily' | 'codeFontFamily';

interface CommandPaletteProps {
  open: boolean;
  notes: NoteRecord[];
  activeNoteId: string | null;
  settings: Settings;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onClose: () => void;
  onSettingsChange: (settings: Settings) => void;
  // Quick action callbacks
  onCopyMarkdown: () => void;
  onCopyRichText: () => void;
  onToggleDarkMode: () => void;
  onExportZip: () => void;
  onExportAll: () => void;
  onExportPDF: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time.daysAgo', { n: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t('time.monthsAgo', { n: months });
  return t('time.yearsAgo', { n: Math.floor(months / 12) });
}

type PaletteView = 'notes' | 'settings';

export function CommandPalette({
  open,
  notes,
  activeNoteId,
  settings,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onClose,
  onSettingsChange,
  onCopyMarkdown,
  onCopyRichText,
  onToggleDarkMode,
  onExportZip,
  onExportAll,
  onExportPDF,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [view, setView] = useState<PaletteView>('notes');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [fonts, setFonts] = useState<string[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontsError, setFontsError] = useState<string | null>(null);
  const [fontSearch, setFontSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FontTarget>('fontFamily');
  const fontSearchRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setView('notes');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Load fonts when settings view opens
  const loadFonts = useCallback(async () => {
    if (fontsLoaded) return;
    if (!('queryLocalFonts' in window)) {
      setFontsError(t('settings.fontNotSupported'));
      setFontsLoaded(true);
      return;
    }
    try {
      const fontData: FontInfo[] = await (window as any).queryLocalFonts();
      const families = [...new Set(fontData.map((f) => f.family))].sort(
        (a, b) => a.localeCompare(b, 'zh-CN')
      );
      setFonts(families);
      setFontsLoaded(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setFontsError(t('settings.fontPermissionDenied'));
      } else {
        setFontsError(t('settings.fontLoadError'));
      }
      setFontsLoaded(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (view === 'settings') {
      loadFonts();
      setFontSearch('');
      setTimeout(() => fontSearchRef.current?.focus(), 50);
    }
  }, [view, loadFonts]);

  // Filter notes based on query
  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase().trim();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filteredNotes.length) {
      setSelectedIndex(Math.max(0, filteredNotes.length - 1));
    }
  }, [filteredNotes.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (view === 'settings') {
      if (e.key === 'Escape') {
        e.preventDefault();
        setView('notes');
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredNotes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredNotes[selectedIndex]) {
          onSelectNote(filteredNotes[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const doAction = (action: () => void) => {
    onClose();
    setTimeout(() => action(), 50);
  };

  if (!open) return null;

  // Settings helpers
  const currentValue = settings[activeTab];
  const defaultValue = activeTab === 'fontFamily' ? 'system-ui' : 'ui-monospace, monospace';
  const defaultLabel = activeTab === 'fontFamily' ? t('settings.systemDefault') : t('settings.systemMono');
  const sizeKey = activeTab === 'fontFamily' ? 'fontSize' : 'codeFontSize';
  const currentSize = settings[sizeKey];
  const FONT_SIZES = [12, 14, 16, 18, 20, 24];
  const sizeIndex = FONT_SIZES.indexOf(currentSize);
  const sliderValue = sizeIndex >= 0 ? sizeIndex : FONT_SIZES.findIndex(s => s >= currentSize);
  const currentDisplayName = currentValue === defaultValue
    ? defaultLabel
    : currentValue.replace(/^"|"$/g, '');
  const filteredFonts = fonts.filter(
    (f) => f.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#242424] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'notes' ? (
          <>
            {/* Search input */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent dark:text-gray-200"
                placeholder={t('palette.searchPlaceholder')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Notes list */}
            <div ref={listRef} className="max-h-80 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  {query ? t('palette.noMatch') : t('palette.empty')}
                </div>
              ) : (
                filteredNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer group ${
                      index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      onSelectNote(note.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${note.id === activeNoteId ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                          {note.title || t('note.untitled')}
                        </span>
                        {note.id === activeNoteId && (
                          <span className="text-xs text-gray-400">{t('note.current')}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeTime(note.updatedAt)}
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-sm ml-2 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      title={t('note.delete')}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Settings view */}
            <div className="flex items-center px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setView('notes')}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('cmd.settings')}</span>
            </div>

            {/* Font tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
              <button
                onClick={() => { setActiveTab('fontFamily'); setFontSearch(''); }}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'fontFamily'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t('settings.textFont')}
              </button>
              <button
                onClick={() => { setActiveTab('codeFontFamily'); setFontSearch(''); }}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'codeFontFamily'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t('settings.codeFont')}
              </button>
            </div>

            {/* Current font + size */}
            <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-gray-700 shrink-0">
              {t('settings.current')}: <span className="text-gray-800 dark:text-gray-200 font-medium" style={{ fontFamily: currentValue }}>{currentDisplayName}</span>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.size')}</span>
                <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">{currentSize}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={FONT_SIZES.length - 1}
                step={1}
                value={sliderValue >= 0 ? sliderValue : 0}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  onSettingsChange({ ...settings, [sizeKey]: FONT_SIZES[idx] });
                }}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-0.5">
                {FONT_SIZES.map((s) => (
                  <span key={s} className={`text-[10px] ${s === currentSize ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-300 dark:text-gray-600'}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Default option */}
            <button
              onClick={() => onSettingsChange({ ...settings, [activeTab]: defaultValue })}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between shrink-0 ${
                currentValue === defaultValue
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>{defaultLabel}</span>
              {currentValue === defaultValue && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Font search */}
            <div className="px-3 py-1.5 shrink-0 border-t border-gray-100 dark:border-gray-700">
              <input
                ref={fontSearchRef}
                type="text"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder={t('settings.searchFont')}
                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-transparent dark:text-gray-200 focus:outline-none focus:border-blue-300"
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setView('notes'); } }}
              />
            </div>

            {/* Font list */}
            <div className="overflow-y-auto flex-1 max-h-56">
              {fontsError && (
                <div className="px-3 py-2 text-xs text-red-500">{fontsError}</div>
              )}
              {!fontsLoaded && !fontsError && (
                <div className="px-3 py-2 text-xs text-gray-400">{t('settings.loadingFonts')}</div>
              )}
              {fontsLoaded && !fontsError && filteredFonts.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">
                  {fontSearch ? t('settings.noMatch') : t('settings.noFonts')}
                </div>
              )}
              {filteredFonts.map((family) => {
                const value = `"${family}"`;
                return (
                  <button
                    key={family}
                    onClick={() => onSettingsChange({ ...settings, [activeTab]: value })}
                    className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                      currentValue === value
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ fontFamily: value }}
                  >
                    <span className="truncate">{family}</span>
                    {currentValue === value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 ml-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footer: quick actions */}
        <div className="flex items-center justify-center gap-1 px-3 py-2 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => doAction(onCreateNote)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.newNote')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
          <button onClick={() => doAction(onCopyMarkdown)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.copyMarkdown')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
          </button>
          <button onClick={() => doAction(onCopyRichText)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.copyRichText')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
          <button onClick={() => doAction(onToggleDarkMode)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.darkMode')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
          </button>
          <button onClick={() => setView(view === 'settings' ? 'notes' : 'settings')} className={`p-2 rounded-md transition-colors ${view === 'settings' ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200'}`} title={t('cmd.settings')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.212-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
          <button onClick={() => doAction(onExportZip)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.exportZip')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
          <button onClick={() => doAction(onExportAll)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.exportAll')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
          </button>
          <button onClick={() => doAction(onExportPDF)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title={t('cmd.exportPDF')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.103 48.103 0 0 1 10.5 0m-10.5 0V5.625c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v2.034" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
