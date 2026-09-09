import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Check, Copy } from 'lucide-react';
import { FormattedText } from '../ui/formatted-text';
import type { Experience, RewrittenExperience } from '@linkegringo/core';

export interface ExperienceSectionProps {
  originalExperiences: Experience[];
  rewrittenExperiences: RewrittenExperience[];
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function ExperienceSection({
  originalExperiences,
  rewrittenExperiences,
  onCopy,
  copiedKey,
}: ExperienceSectionProps) {
  return (
    <div id="profile-section-experience" className="space-y-4">
      {rewrittenExperiences.map((exp, idx) => {
        const expText = `${exp.title} | ${exp.companyName}\n${exp.bullets
          .map((b) => `• ${b}`)
          .join('\n')}`;

        const originalExp =
          originalExperiences.find(
            (e) =>
              e.companyName.toLowerCase().trim() === exp.companyName.toLowerCase().trim() ||
              e.title.toLowerCase().trim() === exp.title.toLowerCase().trim(),
          ) || originalExperiences[idx];

        return (
          <Card
            key={idx}
            id={`experience-block-${idx}`}
            className="p-5 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white text-base">{exp.title}</h4>
                <p className="text-xs text-blue-400 font-medium">{exp.companyName}</p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => onCopy(expText, `exp-${idx}`)}
                className="text-xs gap-1.5 font-medium border border-[#1E293B] bg-[#090D14] hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                {copiedKey === `exp-${idx}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar bullets
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-[#1E293B]">
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
                <span className="font-semibold text-rose-400 text-xs block">
                  Antes (LinkedIn Original)
                </span>
                {originalExp?.description && originalExp.description.trim().length > 0 ? (
                  <p className="text-slate-400 whitespace-pre-line italic leading-relaxed text-xs sm:text-sm">
                    {originalExp.description.trim()}
                  </p>
                ) : (
                  <p className="text-slate-500 italic leading-relaxed text-xs sm:text-sm">
                    (Cargo cadastrado sem descrição ou bullets no perfil original do LinkedIn)
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-1.5">
                <span className="font-semibold text-emerald-400 text-xs block">
                  Depois (Versão dos EUA • Framework XYZ)
                </span>
                <ul className="space-y-1.5 text-slate-100 leading-relaxed text-xs sm:text-sm">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <FormattedText text={bullet} as="span" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
