interface ShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Ctrl+N', desc: '新建笔记' },
  { key: 'Ctrl+P', desc: '搜索 / 切换笔记' },
  { key: 'Ctrl+L', desc: '切换大纲' },
  { key: 'Ctrl+D', desc: '切换暗黑模式' },
  { key: 'Ctrl+,', desc: '字体设置' },
  { key: 'Ctrl+?', desc: '快捷键帮助' },
  { key: '', desc: '' },
  { key: 'Ctrl+B', desc: '粗体' },
  { key: 'Ctrl+I', desc: '斜体' },
  { key: 'Ctrl+Z', desc: '撤销' },
  { key: 'Ctrl+Shift+Z', desc: '重做' },
];

export function ShortcutsPanel({ open, onClose }: ShortcutsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#242424] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">快捷键</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((item, i) =>
            item.key === '' ? (
              <hr key={i} className="border-gray-100 dark:border-gray-700" />
            ) : (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</span>
                <kbd className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                  {item.key}
                </kbd>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
