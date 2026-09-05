import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

export interface ModelOption {
  id: string;
  displayName: string;
  description?: string;
  badge?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  models: ModelOption[];
  disabled?: boolean;
  disabledMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function formatTokenLimit(tokens?: number): string | null {
  if (!tokens || tokens <= 0) return null;
  if (tokens >= 1_000_000) {
    const val = parseFloat((tokens / 1_000_000).toFixed(1));
    return `${val}M`;
  }
  if (tokens >= 1_000) {
    const val = Math.round(tokens / 1_000);
    return `${val}k`;
  }
  return `${tokens}`;
}

export function formatTokensSummary(input?: number, output?: number): string | null {
  const inStr = formatTokenLimit(input);
  const outStr = formatTokenLimit(output);
  if (inStr && outStr) {
    return `${inStr} in • ${outStr} out`;
  }
  if (inStr) {
    return `${inStr} tokens`;
  }
  if (outStr) {
    return `${outStr} out`;
  }
  return null;
}

function renderBadge(badge?: string) {
  if (!badge) return null;
  const lower = badge.toLowerCase();
  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

  if (lower.includes('recomenda')) {
    colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (lower.includes('experim') || lower.includes('preview')) {
    colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (lower.includes('estáv') || lower.includes('estav')) {
    colorClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${colorClass}`}
    >
      {badge}
    </span>
  );
}

export function ModelSelect({
  value,
  onChange,
  models,
  disabled = false,
  disabledMessage = 'Insira uma chave válida para carregar os modelos',
  isLoading = false,
  className = '',
}: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = models.find((m) => m.id === value);

  // Close on outside click or Escape (using capture to avoid closing parent Dialog)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setActiveIndex(0);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredModels = models.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredModels.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredModels[activeIndex]) {
        onChange(filteredModels[activeIndex].id);
        setIsOpen(false);
      }
    }
  };

  const isActuallyDisabled = disabled || isLoading;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={isActuallyDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          isActuallyDisabled
            ? 'border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed text-slate-500'
            : isOpen
              ? 'border-emerald-500 bg-slate-900 ring-1 ring-emerald-500 text-white shadow-lg'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Carregando modelos disponíveis...</span>
            </div>
          ) : disabled ? (
            <span className="text-xs text-slate-500 italic truncate">
              {disabledMessage}
            </span>
          ) : selectedModel ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-slate-100 truncate">
                {selectedModel.displayName}
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline truncate">
                ({selectedModel.id})
              </span>
              {renderBadge(selectedModel.badge)}
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              {value ? value : 'Selecione um modelo...'}
            </span>
          )}
        </div>

        <div className="shrink-0 flex items-center">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && !isActuallyDisabled && (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl p-2 max-h-80 flex flex-col backdrop-blur-md"
        >
          {/* Quick Search */}
          <div className="relative mb-2 flex items-center border border-slate-800 bg-slate-950/70 rounded-lg px-2.5 py-1.5 focus-within:border-emerald-500/80">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por nome ou id (ex: 2.0, flash, pro)..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveIndex(0);
                }}
                className="text-slate-400 hover:text-white p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List Options */}
          <div role="listbox" className="overflow-y-auto space-y-1 pr-1 max-h-56">
            {filteredModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {searchQuery.trim()
                  ? `Nenhum modelo encontrado para "${searchQuery}"`
                  : 'Nenhum modelo disponível.'}
              </div>
            ) : (
              filteredModels.map((m, index) => {
                const isSelected = m.id === value;
                const isFocused = index === activeIndex;
                const tokenSummary = formatTokensSummary(m.inputTokenLimit, m.outputTokenLimit);

                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                        : isFocused
                          ? 'bg-slate-800/90 border border-slate-700/60 text-slate-200'
                          : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-100">
                          {m.displayName}
                        </span>
                        {renderBadge(m.badge)}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap">
                        <span>{m.id}</span>
                        {tokenSummary && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            • {tokenSummary}
                          </span>
                        )}
                      </div>

                      {m.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 mt-1">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
