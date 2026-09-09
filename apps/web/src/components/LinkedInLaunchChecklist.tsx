import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  ListChecks,
  Check,
  Copy,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/file-utils';
import { deriveOpenToWorkTitles } from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';

export interface LinkedInLaunchChecklistProps {
  primaryRole?: string;
  alternativeRoles?: string[];
  openToWorkTitles?: string[];
}

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  completed: boolean;
}

export function LinkedInLaunchChecklist({
  primaryRole,
  alternativeRoles,
  openToWorkTitles,
}: LinkedInLaunchChecklistProps) {
  const derived = deriveOpenToWorkTitles(primaryRole, alternativeRoles);
  const titles =
    openToWorkTitles && openToWorkTitles.length >= 5
      ? openToWorkTitles.slice(0, 5)
      : Array.from(new Set([...(openToWorkTitles || []), ...derived])).slice(0, 5);

  const [copiedTitles, setCopiedTitles] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'step-headline-about',
      label: '1. Atualize Headline e About no LinkedIn',
      detail: 'Cole o novo título estratégico e o About em inglês americano com hook direto de 2 linhas.',
      completed: false,
    },
    {
      id: 'step-experience',
      label: '2. Atualize os Bullets das Experiências',
      detail: 'Substitua descrições passivas pelos novos bullet points orientados a impacto (Framework XYZ).',
      completed: false,
    },
    {
      id: 'step-opentowork',
      label: '3. Ative "Open to Work" Invisível ("Apenas Recrutadores")',
      detail: 'Configure a visibilidade para recrutadores, modelo Remoto e localidade Estados Unidos (Spotlight).',
      completed: false,
    },
    {
      id: 'step-secondary-profile',
      label: '4. Crie o Perfil Secundário em Inglês',
      detail: 'Use a opção "Adicionar perfil em outro idioma" para indexação nativa no algoritmo de busca dos EUA.',
      completed: false,
    },
    {
      id: 'step-company-pages',
      label: '5. Vincule experiências às Páginas Oficiais',
      detail: 'Conecte cada cargo à Company Page oficial no LinkedIn, eliminando os logotipos cinzas não verificados.',
      completed: false,
    },
    {
      id: 'step-featured-skills',
      label: '6. Configure Seção em Destaque & Top Skills',
      detail: 'Fixe GitHub e artigos técnicos no Featured, e ordene as 3 a 5 principais competências do seu cargo.',
      completed: false,
    },
  ]);

  const handleToggle = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  const handleCopyTitles = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = titles.join('\n');
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedTitles(true);
      setTimeout(() => setCopiedTitles(false), 2500);
    }
  };

  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-xl w-full">
      <CardHeader className="p-5 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                Passos para atualizar o LinkedIn
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Abra o LinkedIn em outra aba e marque os itens conforme atualizar seu perfil.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14] font-mono"
            >
              {completedCount} / {checklist.length} concluídos
            </Badge>

            <a
              href="https://www.linkedin.com/in/me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>Abrir perfil no LinkedIn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-0 space-y-5">
        {/* Open to Work Spotlight 5 Titles Tooltip Card */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/15 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                5 Títulos Estratégicos para o "Open to Work" (Spotlight)
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCopyTitles}
              className="text-xs gap-1.5 font-medium border border-blue-500/30 bg-[#090D14] hover:bg-blue-900/30 text-blue-200 self-start sm:self-auto cursor-pointer"
            >
              {copiedTitles ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5 títulos copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copiar 5 títulos</span>
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No LinkedIn, configure o Open to Work com visibilidade <strong>"Apenas recrutadores"</strong> e adicione exatamente estes 5 títulos:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {titles.map((title, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-[#090D14] text-slate-200 border border-blue-500/30 font-mono shadow-sm"
              >
                <span className="text-blue-400 font-bold">#{idx + 1}</span>
                {title}
              </span>
            ))}
          </div>
        </div>

        {/* 6 Checklist Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              role="checkbox"
              aria-checked={item.completed}
              tabIndex={0}
              onClick={() => handleToggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleToggle(item.id);
                }
              }}
              className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                item.completed
                  ? 'border-emerald-500/30 bg-emerald-950/15 text-slate-400'
                  : 'border-[#1E293B] bg-[#090D14]/60 text-slate-200 hover:border-slate-700 hover:bg-[#090D14]/90'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`h-5 w-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.completed
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-700 bg-slate-900/80'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">
                    {item.completed ? 'Concluído' : 'Pendente'}
                  </span>
                </div>

                <p
                  className={`text-xs sm:text-sm font-semibold leading-tight ${
                    item.completed ? 'line-through text-slate-500' : 'text-white'
                  }`}
                >
                  {item.label}
                </p>

                <FormattedText
                  text={item.detail}
                  as="p"
                  className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 6/6 All Completed Notification */}
        {completedCount === checklist.length && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong className="text-white block">Perfil 100% lançado para o mercado dos EUA!</strong>
              Seu perfil agora conta com metadados invisíveis, 5 títulos indexáveis e posicionamento de alto CTR para recrutadores técnicos.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
