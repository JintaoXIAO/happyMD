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
  onClose: () => void;
}

export function TableOfContents({ visible, items, activePos, onItemClick, onClose }: TableOfContentsProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-1/3 -translate-y-1/2 left-8 z-40 w-48 max-h-[50vh] overflow-y-auto py-2 px-1 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md rounded-lg">
      {items.length === 0 ? (
        <div className="text-xs text-gray-300 dark:text-gray-600 px-2">暂无标题</div>
      ) : (
        <nav className="flex flex-col">
          {items.map((item, index) => (
            <button
              key={`${item.pos}-${index}`}
              className={`text-left text-xs py-0.5 rounded transition-colors truncate ${
                activePos === item.pos
                  ? 'text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
