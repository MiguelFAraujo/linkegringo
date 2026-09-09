import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Copy } from 'lucide-react';
import type { Skill } from '@linkegringo/core';

export interface SkillsSectionProps {
  originalSkills?: Skill[];
  rewrittenSkills: string[];
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function SkillsSection({
  originalSkills,
  rewrittenSkills,
  onCopy,
  copiedKey,
}: SkillsSectionProps) {
  return (
    <Card id="profile-section-skills" className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white text-sm sm:text-base">Top skills priorizadas</h3>
          <p className="text-xs text-slate-400">
            Ordenadas por relevância para busca semântica de recrutadores internacionais.
          </p>
        </div>

        <Button
          size="sm"
          variant="default"
          onClick={() => onCopy(rewrittenSkills.join(', '), 'skills')}
          className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
        >
          {copiedKey === 'skills' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copiar lista de skills
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
          <span className="font-semibold text-rose-400 text-xs block">
            Antes (Skills Originais do Perfil)
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {originalSkills && originalSkills.length > 0 ? (
              originalSkills.map((s, sIdx) => (
                <Badge
                  key={sIdx}
                  variant="outline"
                  className="text-xs py-1 px-2.5 bg-[#090D14] border-rose-900/30 text-slate-400 font-normal"
                >
                  {s.name}
                </Badge>
              ))
            ) : (
              <p className="text-slate-400 italic text-xs sm:text-sm">(Nenhuma skill listada originalmente)</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
          <span className="font-semibold text-emerald-400 text-xs block">
            Depois (Top Skills Priorizadas para Recrutadores dos EUA)
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rewrittenSkills.map((skill, sIdx) => (
              <Badge
                key={sIdx}
                variant="outline"
                className="text-xs py-1.5 px-3 bg-[#090D14] border-emerald-500/30 text-slate-200 font-medium"
              >
                <span className="text-emerald-400 mr-1.5 text-xs font-semibold">#{sIdx + 1}</span>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
