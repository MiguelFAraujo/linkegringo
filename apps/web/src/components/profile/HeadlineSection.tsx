import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Check, Copy, CheckCircle2 } from 'lucide-react';
import { FormattedText } from '../ui/formatted-text';
import { isHeadlineAlreadyOptimized } from '@linkegringo/core';

export interface HeadlineSectionProps {
  originalHeadline?: string;
  rewrittenHeadline: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function HeadlineSection({
  originalHeadline,
  rewrittenHeadline,
  onCopy,
  copiedKey,
}: HeadlineSectionProps) {
  const isAlreadyOptimized = isHeadlineAlreadyOptimized(originalHeadline, rewrittenHeadline);
  const length = rewrittenHeadline.length;
  const isWithinRecommended = length <= 160;

  return (
    <Card id="profile-section-headline" className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm sm:text-base">Headline / Título estratégico</h3>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                isWithinRecommended
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {length} caracteres {isWithinRecommended ? '✓ (ideal sem cortes no mobile ≤ 160)' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Título estratégico indexável pelo LinkedIn Recruiter. Cole diretamente no campo Título/Headline.
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={() => onCopy(rewrittenHeadline, 'headline')}
          className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
        >
          {copiedKey === 'headline' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copiar headline
            </>
          )}
        </Button>
      </div>

      {isAlreadyOptimized ? (
        /* Unified single card for already Recruiter-Ready headline */
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Headline Recruiter-Ready
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Recruiter-Ready
            </span>
          </div>
          <FormattedText
            text={rewrittenHeadline}
            as="p"
            className="text-slate-100 font-medium text-xs sm:text-sm leading-relaxed"
          />
          <p className="text-[11px] text-emerald-300/80 pt-2 border-t border-emerald-500/20">
            ✓ Sua headline original já segue a estrutura recomendada para tech recruiters dos EUA e foi mantida como referência de alta conversão.
          </p>
        </div>
      ) : (
        /* Comparative layout (Antes vs Depois) for unoptimized headline */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
            <span className="font-semibold text-rose-400 text-xs block">
              Antes (LinkedIn Original)
            </span>
            <p className="text-slate-400 italic text-xs sm:text-sm leading-relaxed">
              {originalHeadline || '(Vazio ou sem título estratégico)'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-1.5">
            <span className="font-semibold text-emerald-400 text-xs block">
              Depois (Versão dos EUA)
            </span>
            <FormattedText
              text={rewrittenHeadline}
              as="p"
              className="text-slate-100 font-medium text-xs sm:text-sm leading-relaxed"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
