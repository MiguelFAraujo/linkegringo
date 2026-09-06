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

  // 5-Minute Checklist State (6 Critical LinkedIn Recruiter Actions)
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
    <div className="max-w-[1600px] mx-auto w-full space-y-8 animate-in fade-in duration-300 pb-16">
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

      {/* Level 1: 5 Technical Criteria Horizontal Ruler */}
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
                Comparativo detalhado em cada pilar avaliado por recrutadores e algoritmos dos EUA.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14] self-start sm:self-auto font-normal">
              5 Pilares Técnicos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {criteriaBreakdown.map((c) => {
              const delta = c.after - c.before;
              const deltaText = delta > 0 ? `+${delta} pts` : `${delta} pts`;
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
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
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                        {c.name}
                      </h4>
                      <FormattedText
                        text={c.description}
                        as="p"
                        className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#1E293B]/60">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-400 font-bold">{c.before}%</span>
                      <span className="text-slate-600 text-[10px]">➔</span>
                      <span className="text-emerald-400 font-bold">{c.after}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Progress
                        value={c.before}
                        indicatorClassName="bg-rose-500/80"
                        className="h-1.5 bg-[#090D14] border border-[#1E293B]"
                      />
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

      {/* Level 2: Comparative Tabs in Full Width (Before vs After) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Comparativo Antes vs Depois (Copiar em 1 Clique)
            </h2>
            <p className="text-xs text-slate-400">
              Reescrito em 100% inglês americano nativo no framework XYZ com alta conversão para recrutadores dos EUA.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md self-start sm:self-auto">
            100% inglês americano nativo
          </span>
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

      {/* Level 3: 5-Minute Interactive Checklist in Full Width (Consecutive Row) */}
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
              <Badge variant="outline" className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14] font-mono">
                {completedChecklistCount} / {checklist.length} concluídos
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

        <CardContent className="p-5 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

                  <FormattedText text={item.detail} as="p" className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Level 4: Interview Preparation Guide in Full Width (Consecutive Row) */}
      <div className="w-full">
        <InterviewGuideCard />
      </div>

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
