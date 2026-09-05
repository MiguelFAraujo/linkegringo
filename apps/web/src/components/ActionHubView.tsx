import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  ListChecks,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  Share2,
} from 'lucide-react';
import type { Profile, ProfileAnalysis, ProfileReview } from '@linkegringo/core';
import { copyToClipboard, fireConfetti } from '@/lib/file-utils';
import { InterviewGuideCard } from './InterviewGuideCard';

interface ActionHubViewProps {
  originalProfile: Profile;
  initialReview?: ProfileReview;
  analysis: ProfileAnalysis;
  onStartNew: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  completed: boolean;
}

export function ActionHubView({
  originalProfile,
  initialReview,
  analysis,
  onStartNew,
}: ActionHubViewProps) {
  const initialScore = initialReview?.overallScore ?? analysis.initialScore ?? 42;
  const newScore = analysis.overallScore;

  // Fire celebratory confetti when component mounts!
  useEffect(() => {
    fireConfetti();
  }, []);

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 5-Minute Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'step-headline',
      label: '1. Atualize sua Headline no LinkedIn',
      detail: 'Cole o novo título focado em sistemas e valor técnico de alto nível.',
      completed: false,
    },
    {
      id: 'step-about',
      label: '2. Substitua seu About / Summary',
      detail: 'Cole o novo resumo estruturado em inglês americano com hook direto de 2 linhas.',
      completed: false,
    },
    {
      id: 'step-experience',
      label: '3. Atualize os Bullets das Experiências',
      detail: 'Substitua as descrições passivas pelos novos bullet points orientados a impacto (XYZ).',
      completed: false,
    },
    {
      id: 'step-skills',
      label: '4. Reordene suas Top 5 Skills',
      detail: 'Priorize as tecnologias essenciais do seu cargo-alvo para buscas de recrutadores.',
      completed: false,
    },
    {
      id: 'step-opentowork',
      label: '5. Ative "Open to Work" para US Remote',
      detail: 'Configure a visibilidade para "Recruiters only" e adicione localização "United States (Remote)".',
      completed: false,
    },
  ]);

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const generateFullMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${originalProfile.firstName} ${originalProfile.lastName}`);
    lines.push(`**${analysis.rewritten.headline}**`);
    lines.push(`\n## Summary\n${analysis.rewritten.summary}`);
    lines.push('\n## Experience');
    for (const exp of analysis.rewritten.experiences) {
      lines.push(`\n### ${exp.title} | ${exp.companyName}`);
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
    lines.push('\n## Top Skills');
    lines.push(analysis.rewritten.skills.join(', '));
    return lines.join('\n');
  };

  const completedChecklistCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Score Evolution Hero */}
      <Card className="border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Perfil Transformado com Sucesso!
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Evolução da Nota do seu Perfil
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Big Score Comparison */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex-shrink-0">
            {/* Before */}
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Antes
              </span>
              <span className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
                {initialScore}
              </span>
              <span className="text-[10px] text-slate-500 block">/100</span>
            </div>

            <div className="flex flex-col items-center">
              <TrendingUp className="w-6 h-6 text-emerald-400 animate-bounce" />
              <span className="text-[10px] font-bold font-mono text-emerald-400 mt-1">
                +{newScore - initialScore} pts
              </span>
            </div>

            {/* After */}
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                Depois
              </span>
              <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">
                {newScore}
              </span>
              <span className="text-[10px] text-emerald-500/80 block">/100</span>
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Pronto para copiar e colar diretamente no LinkedIn</span>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleCopy(generateFullMarkdown(), 'full-profile')}
            className="w-full sm:w-auto font-bold gap-2 text-xs"
          >
            {copiedKey === 'full-profile' ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Perfil Copiado em Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Perfil Completo (Markdown)</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* 5-Minute Interactive Checklist */}
      <Card className="border-slate-800 bg-slate-900/80 shadow-xl">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-lg sm:text-xl text-white">
                  Checklist de 5 Minutos no LinkedIn
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-400">
                Abra o LinkedIn em outra aba e marque os itens conforme atualizar seu perfil.
              </CardDescription>
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              {completedChecklistCount} / {checklist.length} concluídos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleChecklist(item.id)}
              className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                item.completed
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-slate-400'
                  : 'border-slate-800/80 bg-slate-950/40 text-slate-200 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
              />

              <div className="flex-1">
                <p
                  className={`text-xs sm:text-sm font-semibold ${
                    item.completed ? 'line-through text-slate-500' : 'text-white'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}

          <div className="pt-2 text-right">
            <a
              href="https://www.linkedin.com/in/me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Abrir meu perfil no LinkedIn <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Section by Section Copy-Ready Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Comparativo Antes vs Depois (Copiar em 1 Clique)</span>
          </h2>
          <span className="text-xs text-slate-400">100% Inglês Americano Nativo</span>
        </div>

        <Tabs defaultValue="headline">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-12">
            <TabsTrigger value="headline" className="text-xs sm:text-sm gap-2">
              <FileText className="w-4 h-4" /> Headline
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs sm:text-sm gap-2">
              <FileText className="w-4 h-4" /> About / Summary
            </TabsTrigger>
            <TabsTrigger value="experiences" className="text-xs sm:text-sm gap-2">
              <Briefcase className="w-4 h-4" /> Experiências ({analysis.rewritten.experiences.length})
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs sm:text-sm gap-2">
              <Layers className="w-4 h-4" /> Skills ({analysis.rewritten.skills.length})
            </TabsTrigger>
          </TabsList>

          {/* Headline Tab */}
          <TabsContent value="headline" className="space-y-4">
            <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Headline Otimizada</h3>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(analysis.rewritten.headline, 'headline')}
                  className="text-xs gap-1.5 font-semibold"
                >
                  {copiedKey === 'headline' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Headline
                    </>
                  )}
                </Button>
              </div>

              {/* Before vs After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-rose-400 text-[10px]">
                    Antes (LinkedIn Original)
                  </span>
                  <p className="text-slate-400 italic">
                    {originalProfile.headline || '(Vazio ou sem título estratégico)'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                    Depois (Versão dos EUA)
                  </span>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {analysis.rewritten.headline}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">About / Summary Otimizado</h3>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(analysis.rewritten.summary, 'summary')}
                  className="text-xs gap-1.5 font-semibold"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-rose-400 text-[10px]">
                    Antes (LinkedIn Original)
                  </span>
                  <p className="text-slate-400 whitespace-pre-line leading-relaxed italic max-h-80 overflow-y-auto">
                    {originalProfile.summary || '(Resumo curto ou sem dados de escala)'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                    Depois (Versão dos EUA)
                  </span>
                  <p className="text-slate-100 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-medium max-h-80 overflow-y-auto">
                    {analysis.rewritten.summary}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Experiences Tab */}
          <TabsContent value="experiences" className="space-y-4">
            <div className="space-y-4">
              {analysis.rewritten.experiences.map((exp, idx) => {
                const expText = `${exp.title} | ${exp.companyName}\n${exp.bullets
                  .map((b) => `• ${b}`)
                  .join('\n')}`;

                const originalExp =
                  originalProfile.experiences.find(
                    (e) =>
                      e.companyName.toLowerCase().trim() === exp.companyName.toLowerCase().trim() ||
                      e.title.toLowerCase().trim() === exp.title.toLowerCase().trim(),
                  ) || originalProfile.experiences[idx];

                return (
                  <Card key={idx} className="p-5 border-slate-800 bg-slate-900/60 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-base">{exp.title}</h4>
                        <p className="text-xs text-emerald-400 font-medium">{exp.companyName}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(expText, `exp-${idx}`)}
                        className="text-xs gap-1.5 font-medium"
                      >
                        {copiedKey === `exp-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Bullets
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Side-by-side Before vs After for Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-800/80">
                      <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
                        <span className="font-bold uppercase tracking-wider text-rose-400 text-[10px]">
                          Antes (LinkedIn Original)
                        </span>
                        <p className="text-slate-400 whitespace-pre-line italic leading-relaxed">
                          {originalExp?.description || originalExp?.title || '(Descrição passiva ou não informada)'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
                        <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                          Depois (Versão dos EUA • Framework XYZ)
                        </span>
                        <ul className="space-y-1.5 text-slate-100 leading-relaxed">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Top Skills Priorizadas</h3>
                  <p className="text-xs text-slate-400">
                    Ordenadas por relevância para busca semântica de recrutadores internacionais.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCopy(analysis.rewritten.skills.join(', '), 'skills')}
                  className="text-xs gap-1.5 font-semibold"
                >
                  {copiedKey === 'skills' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Lista de Skills
                    </>
                  )}
                </Button>
              </div>

              {/* Side-by-side Before vs After for Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-rose-400 text-[10px]">
                    Antes (Skills Originais do Perfil)
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {originalProfile.skills && originalProfile.skills.length > 0 ? (
                      originalProfile.skills.map((s, sIdx) => (
                        <Badge
                          key={sIdx}
                          variant="outline"
                          className="text-xs py-1 px-2.5 bg-slate-950 border-rose-900/40 text-slate-400 font-normal"
                        >
                          {s.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">(Nenhuma skill listada originalmente)</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                    Depois (Top Skills Priorizadas para Recrutadores dos EUA)
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.rewritten.skills.map((skill, sIdx) => (
                      <Badge
                        key={sIdx}
                        variant="outline"
                        className="text-xs py-1.5 px-3 bg-slate-950 border-emerald-500/40 text-slate-200 font-medium"
                      >
                        <span className="text-emerald-400 font-mono mr-1.5 text-[10px]">#{sIdx + 1}</span>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Special Interview Pocket Guide Card */}
      <InterviewGuideCard />

      {/* Bottom Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center sm:text-left">
        <div>
          <h4 className="font-bold text-white text-base">Deseja otimizar outro perfil?</h4>
          <p className="text-xs text-slate-400">
            Você pode limpar esta sessão e carregar um novo PDF ou testar outro cargo-alvo.
          </p>
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={onStartNew}
          className="w-full sm:w-auto text-xs"
        >
          Iniciar Novo Perfil
        </Button>
      </div>
    </div>
  );
}
