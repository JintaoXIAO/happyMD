import { useState, useRef, useEffect } from 'react';
import { t } from './i18n';

interface TableInsertButtonProps {
  onInsert: (row: number, col: number) => void;
}

export function TableInsertButton({ onInsert }: TableInsertButtonProps) {
  const [open, setOpen] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const MAX_ROWS = 8;
  const MAX_COLS = 8;

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

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title={t('toolbar.insertTable')}
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <div className="text-xs text-gray-500 text-center mb-1.5">
            {hoverRow > 0 && hoverCol > 0
              ? t('table.grid', { row: hoverRow, col: hoverCol })
              : t('table.title')}
          </div>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
            onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
          >
            {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, i) => {
              const r = Math.floor(i / MAX_COLS) + 1;
              const c = (i % MAX_COLS) + 1;
              const isActive = r <= hoverRow && c <= hoverCol;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 border rounded-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-100 border-blue-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onInsert(r, c);
                    setOpen(false);
                    setHoverRow(0);
                    setHoverCol(0);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
