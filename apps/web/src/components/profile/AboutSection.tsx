import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Check, Copy } from 'lucide-react';
import { FormattedText } from '../ui/formatted-text';

export interface AboutSectionProps {
  originalSummary?: string;
  rewrittenSummary: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function AboutSection({
  originalSummary,
  rewrittenSummary,
  onCopy,
  copiedKey,
}: AboutSectionProps) {
  return (
    <Card id="profile-section-about" className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm sm:text-base">About / Summary otimizado</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
              {rewrittenSummary.length} caracteres (ideal: 1.200 a 1.600)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Resumo estruturado para leitura F-shape em 6s. Quebras de linha e bullets são 100% preservados ao colar no LinkedIn.
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={() => onCopy(rewrittenSummary, 'summary')}
          className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
        >
          {copiedKey === 'summary' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copiar About
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
          <span className="font-semibold text-rose-400 text-xs block">
            Antes (LinkedIn Original)
          </span>
          <p className="text-slate-400 whitespace-pre-wrap leading-relaxed italic text-xs sm:text-sm max-h-80 overflow-y-auto">
            {originalSummary || '(Resumo curto ou sem dados de escala)'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
          <span className="font-semibold text-emerald-400 text-xs block">
            Depois (Versão dos EUA)
          </span>
          <FormattedText
            text={rewrittenSummary}
            as="div"
            className="text-slate-100 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-normal max-h-80 overflow-y-auto"
          />
        </div>
      </div>
    </Card>
  );
}
