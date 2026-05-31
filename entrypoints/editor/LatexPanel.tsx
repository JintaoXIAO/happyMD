import { useState, useRef, useEffect } from 'react';
import { t } from './i18n';
import katex from 'katex';

// Pre-render KaTeX HTML at module level (avoids re-render on each open)
const renderedLatexCache: Record<string, string> = {};

interface LatexSymbol {
  label: string;
  latex: string;
  display?: string; // rendered preview text
}

interface LatexCategory {
  name: string;
  layout?: 'grid' | 'rendered' | 'rendered-grid';
  symbols: LatexSymbol[];
}

const LATEX_CATEGORIES: LatexCategory[] = [
  {
    name: t('latex.greek'),
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
    name: t('latex.operators'),
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
    name: t('latex.arrows'),
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
    name: t('latex.structure'),
    layout: 'rendered-grid',
    symbols: [
      { label: 'a/b', latex: '\\frac{a}{b}' },
      { label: '√', latex: '\\sqrt{x}' },
      { label: 'ⁿ√', latex: '\\sqrt[n]{x}' },
      { label: 'x²', latex: 'x^{2}' },
      { label: 'xₙ', latex: 'x_{n}' },
      { label: 'Σ', latex: '\\sum_{i=1}^{n}' },
      { label: '∏', latex: '\\prod_{i=1}^{n}' },
      { label: '∫', latex: '\\int_{a}^{b}' },
      { label: '∬', latex: '\\iint' },
      { label: 'lim', latex: '\\lim_{x \\to \\infty}' },
      { label: '()', latex: '\\left( \\right)' },
      { label: '[]', latex: '\\left[ \\right]' },
      { label: '{}', latex: '\\left\\{ \\right\\}' },
      { label: '||', latex: '\\left| \\right|' },
    ],
  },
  {
    name: t('latex.common'),
    layout: 'rendered',
    symbols: [
      { label: 'E=mc²', latex: 'E = mc^2' },
      { label: 'a²+b²=c²', latex: 'a^2 + b^2 = c^2' },
      { label: 'x=?', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
      { label: '[a b; c d]', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { label: '|a b; c d|', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
      { label: 'f(x)={', latex: 'f(x) = \\begin{cases} x & x \\geq 0 \\\\ -x & x < 0 \\end{cases}' },
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

  // Pre-render KaTeX HTML for rendered categories
  const renderedLatex = useMemo(() => {
    const cache: Record<string, string> = {};
    for (const cat of LATEX_CATEGORIES) {
      if (cat.layout === 'rendered' || cat.layout === 'rendered-grid') {
        for (const sym of cat.symbols) {
          try {
            cache[sym.latex] = katex.renderToString(sym.latex, {
              throwOnError: false,
              displayMode: false,
            });
          } catch {
            cache[sym.latex] = sym.latex;
          }
        }
      }
    }
    return cache;
  }, []);

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
        title={t('toolbar.insertLatex')}
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
        <div className="absolute bottom-full left-0 mb-1 w-96 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 flex max-h-[24rem]">
          {/* Category tabs - vertical left sidebar */}
          <div className="flex flex-col border-r border-gray-100 dark:border-gray-700 shrink-0 py-1">
            {LATEX_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors text-left ${
                  activeCategory === i
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Right content area */}
          <div className="flex flex-col flex-1 min-w-0">

          {/* Symbols */}
          <div className="p-2 overflow-y-auto flex-1">
            {currentCategory.layout === 'rendered' ? (
              <div className="grid grid-cols-2 gap-1">
                {currentCategory.symbols.map((sym) => (
                  <button
                    key={sym.latex}
                    onClick={() => { onInsert(sym.latex); }}
                    className="flex items-center px-2 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                    title={sym.latex}
                  >
                    <span
                      dangerouslySetInnerHTML={{ __html: renderedLatex[sym.latex] || sym.latex }}
                    />
                  </button>
                ))}
              </div>
            ) : currentCategory.layout === 'rendered-grid' ? (
              <div className="grid grid-cols-4 gap-1">
                {currentCategory.symbols.map((sym) => (
                  <button
                    key={sym.latex}
                    onClick={() => { onInsert(sym.latex); }}
                    className="flex items-center justify-center p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                    title={sym.latex}
                  >
                    <span
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: renderedLatex[sym.latex] || sym.latex }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-1">
                {currentCategory.symbols.map((sym) => (
                  <button
                    key={sym.latex}
                    onClick={() => { onInsert(sym.latex); }}
                    className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700 group"
                    title={sym.latex}
                  >
                    <span className="text-base leading-none">{sym.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Insert block formula button */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-2 shrink-0">
            <button
              onClick={() => {
                onInsert('', true);
                setOpen(false);
              }}
              className="w-full text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded py-1.5 transition-colors"
            >
              {t('latex.insertBlock')} ($$...$$)
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
