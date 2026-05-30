import { useState, useRef, useEffect } from 'react';

interface LatexSymbol {
  label: string;
  latex: string;
  display?: string; // rendered preview text
}

interface LatexCategory {
  name: string;
  symbols: LatexSymbol[];
}

const LATEX_CATEGORIES: LatexCategory[] = [
  {
    name: '希腊字母',
    symbols: [
      { label: 'α', latex: '\\alpha' },
      { label: 'β', latex: '\\beta' },
      { label: 'γ', latex: '\\gamma' },
      { label: 'δ', latex: '\\delta' },
      { label: 'ε', latex: '\\epsilon' },
      { label: 'ζ', latex: '\\zeta' },
      { label: 'η', latex: '\\eta' },
      { label: 'θ', latex: '\\theta' },
      { label: 'λ', latex: '\\lambda' },
      { label: 'μ', latex: '\\mu' },
      { label: 'π', latex: '\\pi' },
      { label: 'ρ', latex: '\\rho' },
      { label: 'σ', latex: '\\sigma' },
      { label: 'τ', latex: '\\tau' },
      { label: 'φ', latex: '\\phi' },
      { label: 'ω', latex: '\\omega' },
      { label: 'Γ', latex: '\\Gamma' },
      { label: 'Δ', latex: '\\Delta' },
      { label: 'Θ', latex: '\\Theta' },
      { label: 'Λ', latex: '\\Lambda' },
      { label: 'Π', latex: '\\Pi' },
      { label: 'Σ', latex: '\\Sigma' },
      { label: 'Φ', latex: '\\Phi' },
      { label: 'Ω', latex: '\\Omega' },
    ],
  },
  {
    name: '运算符',
    symbols: [
      { label: '±', latex: '\\pm' },
      { label: '×', latex: '\\times' },
      { label: '÷', latex: '\\div' },
      { label: '·', latex: '\\cdot' },
      { label: '≠', latex: '\\neq' },
      { label: '≈', latex: '\\approx' },
      { label: '≤', latex: '\\leq' },
      { label: '≥', latex: '\\geq' },
      { label: '∞', latex: '\\infty' },
      { label: '∂', latex: '\\partial' },
      { label: '∇', latex: '\\nabla' },
      { label: '∈', latex: '\\in' },
      { label: '∉', latex: '\\notin' },
      { label: '⊂', latex: '\\subset' },
      { label: '⊃', latex: '\\supset' },
      { label: '∪', latex: '\\cup' },
      { label: '∩', latex: '\\cap' },
      { label: '∧', latex: '\\wedge' },
      { label: '∨', latex: '\\vee' },
      { label: '⊕', latex: '\\oplus' },
    ],
  },
  {
    name: '箭头',
    symbols: [
      { label: '←', latex: '\\leftarrow' },
      { label: '→', latex: '\\rightarrow' },
      { label: '↔', latex: '\\leftrightarrow' },
      { label: '⇐', latex: '\\Leftarrow' },
      { label: '⇒', latex: '\\Rightarrow' },
      { label: '⇔', latex: '\\Leftrightarrow' },
      { label: '↑', latex: '\\uparrow' },
      { label: '↓', latex: '\\downarrow' },
      { label: '↦', latex: '\\mapsto' },
      { label: '⟶', latex: '\\longrightarrow' },
    ],
  },
  {
    name: '结构',
    symbols: [
      { label: 'a/b', latex: '\\frac{a}{b}', display: '分数' },
      { label: '√', latex: '\\sqrt{x}', display: '平方根' },
      { label: 'ⁿ√', latex: '\\sqrt[n]{x}', display: 'n次根' },
      { label: 'x²', latex: 'x^{2}', display: '上标' },
      { label: 'xₙ', latex: 'x_{n}', display: '下标' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n}', display: '求和' },
      { label: '∏', latex: '\\prod_{i=1}^{n}', display: '连乘' },
      { label: '∫', latex: '\\int_{a}^{b}', display: '积分' },
      { label: '∬', latex: '\\iint', display: '二重积分' },
      { label: 'lim', latex: '\\lim_{x \\to \\infty}', display: '极限' },
      { label: '()', latex: '\\left( \\right)', display: '括号' },
      { label: '[]', latex: '\\left[ \\right]', display: '方括号' },
      { label: '{}', latex: '\\left\\{ \\right\\}', display: '花括号' },
      { label: '||', latex: '\\left| \\right|', display: '绝对值' },
    ],
  },
  {
    name: '常用公式',
    symbols: [
      { label: 'E=mc²', latex: 'E = mc^2', display: '质能方程' },
      { label: 'a²+b²=c²', latex: 'a^2 + b^2 = c^2', display: '勾股定理' },
      { label: '求根', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', display: '一元二次' },
      { label: '矩阵', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', display: '2×2矩阵' },
      { label: '行列式', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', display: '行列式' },
      { label: '分段', latex: 'f(x) = \\begin{cases} x & x \\geq 0 \\\\ -x & x < 0 \\end{cases}', display: '分段函数' },
    ],
  },
];

interface LatexPanelProps {
  onInsert: (latex: string, block?: boolean) => void;
}

export function LatexPanel({ onInsert }: LatexPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const currentCategory = LATEX_CATEGORIES[activeCategory];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="插入公式"
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
          <line x1="4" y1="20" x2="7" y2="4" />
          <line x1="12" y1="20" x2="15" y2="4" />
          <line x1="2" y1="14" x2="17" y2="14" />
          <path d="M17 8l3 4-3 4" />
          <path d="M21 4l-1 16" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col max-h-[22rem]">
          {/* Category tabs */}
          <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
            {LATEX_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Symbols grid */}
          <div className="p-2 overflow-y-auto flex-1">
            <div className="grid grid-cols-6 gap-1">
              {currentCategory.symbols.map((sym) => (
                <button
                  key={sym.latex}
                  onClick={() => {
                    onInsert(sym.latex);
                  }}
                  className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 group"
                  title={`${sym.display || sym.latex}`}
                >
                  <span className="text-base leading-none">{sym.label}</span>
                  {sym.display && (
                    <span className="text-[9px] text-gray-400 mt-0.5 group-hover:text-blue-500 truncate max-w-full">
                      {sym.display}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Insert block formula button */}
          <div className="border-t border-gray-100 p-2 shrink-0">
            <button
              onClick={() => {
                onInsert('', true);
                setOpen(false);
              }}
              className="w-full text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded py-1.5 transition-colors"
            >
              插入块级公式 ($$...$$)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
