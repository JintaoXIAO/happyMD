import { useState, useRef, useEffect } from 'react';
import { t } from './i18n';

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
    symbols: [
      { label: 'a/b', latex: '\\frac{a}{b}', display: t('latex.sym.fraction') },
      { label: '√', latex: '\\sqrt{x}', display: t('latex.sym.sqrt') },
      { label: 'ⁿ√', latex: '\\sqrt[n]{x}', display: t('latex.sym.nthRoot') },
      { label: 'x²', latex: 'x^{2}', display: t('latex.sym.superscript') },
      { label: 'xₙ', latex: 'x_{n}', display: t('latex.sym.subscript') },
      { label: 'Σ', latex: '\\sum_{i=1}^{n}', display: t('latex.sym.sum') },
      { label: '∏', latex: '\\prod_{i=1}^{n}', display: t('latex.sym.product') },
      { label: '∫', latex: '\\int_{a}^{b}', display: t('latex.sym.integral') },
      { label: '∬', latex: '\\iint', display: t('latex.sym.doubleIntegral') },
      { label: 'lim', latex: '\\lim_{x \\to \\infty}', display: t('latex.sym.limit') },
      { label: '()', latex: '\\left( \\right)', display: t('latex.sym.parentheses') },
      { label: '[]', latex: '\\left[ \\right]', display: t('latex.sym.brackets') },
      { label: '{}', latex: '\\left\\{ \\right\\}', display: t('latex.sym.braces') },
      { label: '||', latex: '\\left| \\right|', display: t('latex.sym.absoluteValue') },
    ],
  },
  {
    name: t('latex.common'),
    symbols: [
      { label: 'E=mc²', latex: 'E = mc^2', display: t('latex.sym.massEnergy') },
      { label: 'a²+b²=c²', latex: 'a^2 + b^2 = c^2', display: t('latex.sym.pythagorean') },
      { label: t('latex.sym.quadraticLabel'), latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', display: t('latex.sym.quadratic') },
      { label: t('latex.sym.matrixLabel'), latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', display: t('latex.sym.matrix') },
      { label: t('latex.sym.determinantLabel'), latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', display: t('latex.sym.determinant') },
      { label: t('latex.sym.piecewiseLabel'), latex: 'f(x) = \\begin{cases} x & x \\geq 0 \\\\ -x & x < 0 \\end{cases}', display: t('latex.sym.piecewise') },
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
              {t('latex.insertBlock')} ($$...$$)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
