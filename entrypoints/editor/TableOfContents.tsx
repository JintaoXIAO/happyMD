export interface TocItem {
  level: number;
  text: string;
  pos: number;
}

interface TableOfContentsProps {
  visible: boolean;
  items: TocItem[];
  activePos: number | null;
  onItemClick: (pos: number) => void;
}

export function TableOfContents({ visible, items, activePos, onItemClick }: TableOfContentsProps) {
  if (!visible) return null;

  return (
    <div className="w-48 shrink-0 border-l border-gray-100 dark:border-gray-700 overflow-y-auto py-3 px-2 dark:bg-[#1a1a1a]">
      <div className="text-xs font-medium text-gray-400 px-2 mb-2">大纲</div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-300 dark:text-gray-600 px-2">暂无标题</div>
      ) : (
        <nav className="flex flex-col gap-0.5">
          {items.map((item, index) => (
            <button
              key={`${item.pos}-${index}`}
              className={`text-left text-xs py-1 px-2 rounded truncate transition-colors ${
                activePos === item.pos
                  ? 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              onClick={() => onItemClick(item.pos)}
              title={item.text}
            >
              {item.text || '无标题'}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
