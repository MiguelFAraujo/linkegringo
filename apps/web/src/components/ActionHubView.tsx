import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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
  ExternalLink,
  BarChart3,
  ShieldCheck,
  Target,
  Search,
} from 'lucide-react';
import type { Profile, ProfileAnalysis, ProfileReview } from '@linkegringo/core';
import { copyToClipboard } from '@/lib/file-utils';
import { InterviewGuideCard } from './InterviewGuideCard';
import { FormattedText } from './ui/formatted-text';
import { CandidateAvatar } from './ui/candidate-avatar';

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
  const scoreDelta = newScore - initialScore;

  // 5 Technical Criteria comparison (Before vs After)
  const criteriaBreakdown = [
    {
      id: 'searchRelevance',
      name: 'Relevância de Busca (Search Relevance)',
      description: 'Correspondência semântica e indexação booleana de palavras-chave técnicas do seu cargo.',
      icon: Search,
      before: initialReview?.scores?.searchRelevance ?? Math.max(30, Math.round(initialScore * 0.95)),
      after: analysis.scores.searchRelevance,
    },
    {
      id: 'humanVoice',
      name: 'Tom de Voz Humano (Human Voice)',
      description: 'Inglês americano nativo, naturalidade executiva e ausência de termos traduzidos ao pé da letra.',
      icon: Sparkles,
      before: initialReview?.scores?.humanVoice ?? Math.max(30, Math.round(initialScore * 1.05)),
      after: analysis.scores.humanVoice,
    },
    {
      id: 'credibility',
      name: 'Credibilidade Técnica (Credibility)',
      description: 'Sinal de senioridade inequívoca, decisões arquiteturais complexas e autonomia comprovada.',
      icon: ShieldCheck,
      before: initialReview?.scores?.credibility ?? Math.max(25, Math.round(initialScore * 0.9)),
      after: analysis.scores.credibility,
    },
    {
      id: 'positioningClarity',
      name: 'Clareza de Posicionamento (Positioning Clarity)',
      description: 'Headline limpa e focada em sistemas de alta escala, sem nichos inventados ou clichês.',
      icon: Target,
      before: initialReview?.scores?.positioningClarity ?? Math.max(25, Math.round(initialScore * 0.85)),
      after: analysis.scores.positioningClarity,
    },
    {
      id: 'evidenceCoverage',
      name: 'Cobertura de Evidências (Evidence Coverage)',
      description: 'Resultados comprovados com números, %, latência e escala no framework STAR/XYZ.',
      icon: BarChart3,
      before: initialReview?.scores?.evidenceCoverage ?? Math.max(25, Math.round(initialScore * 0.88)),
      after: analysis.scores.evidenceCoverage,
    },
  ];

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
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Score Evolution Hero */}
      <Card className="border border-[#1E293B] bg-[#0F1623]/80 shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3.5">
              <CandidateAvatar
                publicId={originalProfile.publicId}
                name={`${originalProfile.firstName || ''} ${originalProfile.lastName || ''}`.trim()}
                size="lg"
                className="ring-1 ring-[#1E293B]"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {originalProfile.firstName} {originalProfile.lastName}
                  </h2>
                  <Badge
                    variant="success"
                    className="gap-1 py-0.5 px-2 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25 font-normal"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Perfil Otimizado</span>
                  </Badge>
                </div>
                <p className="text-xs text-blue-400 font-medium pt-0.5">
                  {analysis.profileDirection.primaryRole || analysis.profileDirection.positioning}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Perfil Otimizado
              </h1>
              <FormattedText
                text={analysis.executiveSummary}
                as="p"
                className="text-xs sm:text-sm text-slate-300 leading-relaxed"
              />
            </div>
          </div>

          {/* Authoritative Score Evolution Block */}
          <div className="flex items-center gap-4 bg-[#090D14]/90 p-4 sm:p-5 rounded-2xl border border-[#1E293B] shadow-lg flex-shrink-0 w-full sm:w-auto justify-center">
            {/* Before */}
            <div className="text-center min-w-[56px]">
              <span className="text-xs text-slate-400 block font-medium">
                Antes
              </span>
              <span className="text-3xl sm:text-4xl font-bold text-rose-400 font-mono tracking-tight">
                {initialScore}
              </span>
              <span className="text-[11px] text-slate-500 block">/ 100</span>
            </div>

            {/* Separator & Delta */}
            <div className="flex flex-col items-center px-2">
              <span className="text-slate-600 text-base sm:text-lg font-bold">➔</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pontos
              </span>
            </div>

            {/* After */}
            <div className="text-center min-w-[56px]">
              <span className="text-xs text-emerald-400 block font-medium">
                Depois
              </span>
              <span className="text-3xl sm:text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                {newScore}
              </span>
              <span className="text-[11px] text-emerald-500/70 block">/ 100</span>
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="mt-6 pt-5 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Pronto para copiar e colar diretamente no LinkedIn</span>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleCopy(generateFullMarkdown(), 'full-profile')}
            className="w-full sm:w-auto font-semibold gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
          >
            {copiedKey === 'full-profile' ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Perfil copiado em markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar perfil completo em markdown</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* 2-Column Operational Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Column (lg:col-span-5): 5 Criteria Breakdown + LinkedIn Checklist */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5 Technical Criteria Breakdown (Before vs After) */}
          <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-xl">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Breakdown dos 5 Critérios Técnicos (Antes vs Depois)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Evolução detalhada em cada pilar avaliado pelos recrutadores e algoritmos dos EUA.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14] self-start sm:self-auto font-normal">
                  5 Pilares Técnicos
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {criteriaBreakdown.map((c) => {
                  const delta = c.after - c.before;
                  const deltaText = delta > 0 ? `+${delta} pts` : `${delta} pts`;
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5 flex-shrink-0 border border-blue-500/20">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                              {c.name}
                            </h4>
                            <FormattedText
                              text={c.description}
                              as="p"
                              className="text-xs text-slate-400 leading-relaxed"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-rose-400 font-bold">{c.before}</span>
                            <span className="text-slate-600">➔</span>
                            <span className="text-emerald-400 font-bold text-xs sm:text-sm">{c.after}</span>
                          </div>
                          <Badge
                            variant={delta > 0 ? 'success' : 'outline'}
                            className={`text-[10px] sm:text-xs font-semibold py-0.5 px-1.5 font-mono ${
                              delta > 0
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : delta === 0
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {deltaText}
                          </Badge>
                        </div>
                      </div>

                      {/* Comparative Progress Bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span className="text-rose-400 font-medium text-[11px]">Antes (Original)</span>
                            <span className="font-mono font-semibold text-rose-400 text-[11px]">{c.before}%</span>
                          </div>
                          <Progress
                            value={c.before}
                            indicatorClassName="bg-rose-500/80"
                            className="h-1.5 bg-[#090D14] border border-[#1E293B]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span className="text-emerald-400 font-medium text-[11px]">Depois (Versão dos EUA)</span>
                            <span className="font-mono font-semibold text-emerald-400 text-[11px]">{c.after}%</span>
                          </div>
                          <Progress
                            value={c.after}
                            indicatorClassName="bg-emerald-500"
                            className="h-1.5 bg-[#090D14] border border-[#1E293B]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 5-Minute Interactive Checklist */}
          <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-xl">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center justify-between">
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

                <Badge variant="outline" className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14]">
                  {completedChecklistCount} / {checklist.length} concluídos
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 pt-0 space-y-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={item.completed}
                  tabIndex={0}
                  onClick={() => handleToggleChecklist(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleChecklist(item.id);
                    }
                  }}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                    item.completed
                      ? 'border-emerald-500/30 bg-emerald-950/15 text-slate-400'
                      : 'border-[#1E293B] bg-[#090D14]/50 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.completed
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-700 bg-slate-900/80'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold ${
                        item.completed ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {item.label}
                    </p>
                    <FormattedText text={item.detail} as="p" className="text-xs text-slate-400 mt-0.5 leading-relaxed" />
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
                  <span>Abrir meu perfil no LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Column (lg:col-span-7): Comparative Tabs (Before vs After) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Comparativo Antes vs Depois (Copiar em 1 Clique)
            </h2>
            <span className="text-xs text-slate-400 font-medium">100% inglês americano nativo</span>
          </div>

          <Tabs defaultValue="headline">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-11 bg-[#090D14] border border-[#1E293B] p-1 rounded-xl">
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
              <Card className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Headline otimizada</h3>
                    <p className="text-xs text-slate-400">Título estratégico indexável com palavras-chave de alto valor.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy(analysis.rewritten.headline, 'headline')}
                    className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white"
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

                {/* Before vs After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
                    <span className="font-semibold text-rose-400 text-xs block">
                      Antes (LinkedIn Original)
                    </span>
                    <p className="text-slate-400 italic text-xs sm:text-sm leading-relaxed">
                      {originalProfile.headline || '(Vazio ou sem título estratégico)'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-1.5">
                    <span className="font-semibold text-emerald-400 text-xs block">
                      Depois (Versão dos EUA)
                    </span>
                    <FormattedText
                      text={analysis.rewritten.headline}
                      as="p"
                      className="text-slate-100 font-medium text-xs sm:text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="summary" className="space-y-4">
              <Card className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">About / Summary otimizado</h3>
                    <p className="text-xs text-slate-400">Resumo estruturado com proposição de valor executivo.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy(analysis.rewritten.summary, 'summary')}
                    className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white"
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
                    <p className="text-slate-400 whitespace-pre-line leading-relaxed italic text-xs sm:text-sm max-h-80 overflow-y-auto">
                      {originalProfile.summary || '(Resumo curto ou sem dados de escala)'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                    <span className="font-semibold text-emerald-400 text-xs block">
                      Depois (Versão dos EUA)
                    </span>
                    <FormattedText
                      text={analysis.rewritten.summary}
                      as="p"
                      className="text-slate-100 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-normal max-h-80 overflow-y-auto"
                    />
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
                    <Card key={idx} className="p-5 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-base">{exp.title}</h4>
                          <p className="text-xs text-blue-400 font-medium">{exp.companyName}</p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(expText, `exp-${idx}`)}
                          className="text-xs gap-1.5 font-medium border border-[#1E293B] bg-[#090D14] hover:bg-slate-800 text-slate-200"
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

                      {/* Side-by-side Before vs After for Experience */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-[#1E293B]">
                        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1.5">
                          <span className="font-semibold text-rose-400 text-xs block">
                            Antes (LinkedIn Original)
                          </span>
                          <p className="text-slate-400 whitespace-pre-line italic leading-relaxed text-xs sm:text-sm">
                            {originalExp?.description || originalExp?.title || '(Descrição passiva ou não informada)'}
                          </p>
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
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4">
              <Card className="p-5 sm:p-6 border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">Top skills priorizadas</h3>
                    <p className="text-xs text-slate-400">
                      Ordenadas por relevância para busca semântica de recrutadores internacionais.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy(analysis.rewritten.skills.join(', '), 'skills')}
                    className="text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-500 text-white"
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

                {/* Side-by-side Before vs After for Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                    <span className="font-semibold text-rose-400 text-xs block">
                      Antes (Skills Originais do Perfil)
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {originalProfile.skills && originalProfile.skills.length > 0 ? (
                        originalProfile.skills.map((s, sIdx) => (
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
                      {analysis.rewritten.skills.map((skill, sIdx) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Special Interview Pocket Guide Card */}
      <InterviewGuideCard />

      {/* Bottom Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#0F1623]/60 border border-[#1E293B] text-center sm:text-left">
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
          className="w-full sm:w-auto text-xs border-[#1E293B] hover:bg-slate-800 text-slate-200"
        >
          Iniciar novo perfil
        </Button>
      </div>
    </div>
  );
}
