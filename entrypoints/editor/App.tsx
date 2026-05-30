import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from './Editor';
import { loadNote, saveNote, loadSettings, saveSettings, DEFAULT_SETTINGS } from './db';
import { SettingsPanel } from './SettingsPanel';
import type { Settings } from './db';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function App() {
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>('');

  useEffect(() => {
    Promise.all([loadNote(), loadSettings()])
      .then(([content, savedSettings]) => {
        const value = content || '# Welcome to HappyNote\n\nStart typing here...';
        setInitialContent(value);
        latestContentRef.current = value;
        setSettings(savedSettings);
      })
      .catch((err) => {
        console.error('Failed to load:', err);
        setInitialContent('# Welcome to HappyNote\n\nStart typing here...');
      });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestContentRef.current) {
        saveNote(latestContentRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleChange = useCallback((markdown: string) => {
    latestContentRef.current = markdown;
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveNote(markdown);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save:', err);
        setSaveStatus('error');
      }
    }, 1000);
  }, []);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings).catch((err) => {
      console.error('Failed to save settings:', err);
    });
  }, []);

  const statusText: Record<SaveStatus, string> = {
    saved: '已保存 ✓',
    saving: '保存中...',
    unsaved: '',
    error: '保存失败 ✗',
  };

  if (initialContent === null) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex justify-between items-center px-6 py-1.5 border-b border-gray-100 text-xs text-gray-400">
          <span className="font-medium tracking-wide">HappyNote</span>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-between items-center px-6 py-1.5 border-b border-gray-100 text-xs text-gray-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide">HappyNote</span>
          <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
        </div>
        <span className="transition-opacity duration-300">
          {statusText[saveStatus]}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-4xl" style={{ '--user-font': settings.fontFamily, '--user-code-font': settings.codeFontFamily } as React.CSSProperties}>
          <Editor defaultValue={initialContent} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}
