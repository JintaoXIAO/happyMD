import { useState, useRef, useEffect, useCallback } from 'react';
import type { Settings } from './db';

interface FontInfo {
  family: string;
  fullName: string;
  style: string;
}

type FontTarget = 'fontFamily' | 'codeFontFamily';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsPanel({ settings, onSettingsChange, open: controlledOpen, onOpenChange }: SettingsPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [fonts, setFonts] = useState<string[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontsError, setFontsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FontTarget>('fontFamily');
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Load system fonts when panel opens
  const loadFonts = useCallback(async () => {
    if (fontsLoaded) return;

    if (!('queryLocalFonts' in window)) {
      setFontsError('浏览器不支持读取本地字体');
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
        setFontsError('用户拒绝了字体访问权限');
      } else {
        setFontsError('无法读取系统字体');
      }
      setFontsLoaded(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (open) {
      loadFonts();
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open, loadFonts]);

  const currentValue = settings[activeTab];
  const defaultValue = activeTab === 'fontFamily' ? 'system-ui' : 'ui-monospace, monospace';
  const defaultLabel = activeTab === 'fontFamily' ? '系统默认' : '系统等宽';

  // Font size for current tab
  const sizeKey = activeTab === 'fontFamily' ? 'fontSize' : 'codeFontSize';
  const currentSize = settings[sizeKey];
  const FONT_SIZES = [12, 14, 16, 18, 20, 24];
  const sizeIndex = FONT_SIZES.indexOf(currentSize);
  const sliderValue = sizeIndex >= 0 ? sizeIndex : FONT_SIZES.findIndex(s => s >= currentSize);

  // Display name for current font
  const currentDisplayName = currentValue === defaultValue
    ? defaultLabel
    : currentValue.replace(/^"|"$/g, '');

  const filteredFonts = fonts.filter(
    (f) => f.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSettingsChange({ ...settings, [activeTab]: value });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="字体设置"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col max-h-[28rem]">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => { setActiveTab('fontFamily'); setSearch(''); }}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'fontFamily'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              正文字体
            </button>
            <button
              onClick={() => { setActiveTab('codeFontFamily'); setSearch(''); }}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'codeFontFamily'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              代码字体
            </button>
          </div>

          {/* Current font indicator */}
          <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 shrink-0">
            当前: <span className="text-gray-800 font-medium" style={{ fontFamily: currentValue }}>{currentDisplayName}</span>
          </div>

          {/* Font size slider */}
          <div className="px-3 py-2 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">大小</span>
              <span className="text-xs text-gray-800 font-medium">{currentSize}px</span>
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
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-0.5">
              {FONT_SIZES.map((s) => (
                <span key={s} className={`text-[10px] ${s === currentSize ? 'text-blue-600 font-medium' : 'text-gray-300'}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Default option */}
          <button
            onClick={() => handleSelect(defaultValue)}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between shrink-0 ${
              currentValue === defaultValue
                ? 'text-blue-600 font-medium'
                : 'text-gray-700'
            }`}
          >
            <span>{defaultLabel}</span>
            {currentValue === defaultValue && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="border-t border-gray-100 shrink-0" />

          {/* Search */}
          <div className="px-3 py-1.5 shrink-0">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索字体..."
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Font list */}
          <div className="overflow-y-auto flex-1">
            {fontsError && (
              <div className="px-3 py-2 text-xs text-red-500">{fontsError}</div>
            )}
            {!fontsLoaded && !fontsError && (
              <div className="px-3 py-2 text-xs text-gray-400">加载字体中...</div>
            )}
            {fontsLoaded && !fontsError && filteredFonts.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">
                {search ? '无匹配字体' : '未找到系统字体'}
              </div>
            )}
            {filteredFonts.map((family) => {
              const value = `"${family}"`;
              return (
                <button
                  key={family}
                  onClick={() => handleSelect(value)}
                  className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    currentValue === value
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-700'
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
        </div>
      )}
    </div>
  );
}
