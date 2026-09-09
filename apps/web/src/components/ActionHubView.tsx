import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Briefcase,
  Layers,
  BarChart3,
  ShieldCheck,
  Target,
  Search,
  Rocket,
} from 'lucide-react';
import {
  type Profile,
  type ProfileAnalysis,
  type ProfileReview,
  type ProfileGap,
  type SearchGap,
  type AppliedMicroIntegration,
  type AiProvider,
} from '@linkegringo/core';
import { copyToClipboard } from '@/lib/file-utils';
import { InterviewGuideCard } from './InterviewGuideCard';
import { FormattedText } from './ui/formatted-text';
import { CandidateAvatar } from './ui/candidate-avatar';
import { RecruiterSearchCard } from './RecruiterSearchCard';
import { LinkedInLaunchChecklist } from './LinkedInLaunchChecklist';
import { RecruiterSearchSimulator } from './RecruiterSearchSimulator';
import { GapResolutionDrawer } from './GapResolutionDrawer';
import { track, toScoreBand } from '@/lib/telemetry';
import {
  HeadlineSection,
  AboutSection,
  ExperienceSection,
  SkillsSection,
} from './profile';

export type HubTab = 'profile' | 'search' | 'launch';

export interface ActionHubViewProps {
  originalProfile: Profile;
  initialReview?: ProfileReview;
  analysis: ProfileAnalysis;
  onStartNew: () => void;
  aiProvider?: AiProvider;
  onUpdateAnalysis?: (analysis: ProfileAnalysis) => void;
}

const getInitialTab = (): HubTab => {
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'search' || tabParam === 'launch' || tabParam === 'profile') {
      return tabParam;
    }
  }
  return 'profile';
};

export function ActionHubView({
  originalProfile,
  initialReview,
  analysis,
  onStartNew,
  aiProvider,
  onUpdateAnalysis,
}: ActionHubViewProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<ProfileAnalysis>(analysis);

  useEffect(() => {
    setActiveAnalysis(analysis);
  }, [analysis]);

  const initialScore = initialReview?.overallScore ?? activeAnalysis.initialScore ?? 42;
  const newScore = activeAnalysis.overallScore;
  const scoreDelta = newScore - initialScore;

  const [currentTab, setCurrentTab] = useState<HubTab>(getInitialTab);
  const [innerCopyTab, setInnerCopyTab] = useState<string>('headline');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Micro-integration drawer state
  const [activeDrawerGap, setActiveDrawerGap] = useState<SearchGap | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerResolvedDiff, setDrawerResolvedDiff] = useState<
    { before: string; after: string; evidenceText?: string; companyName?: string } | undefined
  >(undefined);
  const [resolvedGapMetadata, setResolvedGapMetadata] = useState<
    Record<string, { before: string; after: string; evidenceText?: string; companyName?: string }>
  >({});

  useEffect(() => {
    track('action_hub_viewed', { initialScoreBand: toScoreBand(initialScore) });
  }, [initialScore]);

  // Sync with URL parameters
  const handleTabChange = (tab: string) => {
    const validTab: HubTab = tab === 'search' || tab === 'launch' || tab === 'profile' ? tab : 'profile';
    setCurrentTab(validTab);
    track('tab_switched', { tab: validTab });
    if (validTab === 'search') {
      track('search_tab_opened');
    } else if (validTab === 'launch') {
      track('launch_started');
    }

    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', validTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentTab(getInitialTab());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleFixGap = (gap: ProfileGap) => {
    handleTabChange('profile');

    const targetSection = gap.targetSection;
    const tabMapping: Record<string, string> = {
      headline: 'headline',
      about: 'summary',
      experience: 'experiences',
      skills: 'skills',
    };
    if (tabMapping[targetSection]) {
      setInnerCopyTab(tabMapping[targetSection]);
    }

    setTimeout(() => {
      const targetId = gap.targetBlockId || `profile-section-${targetSection}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-500', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-blue-500');
        }, 2500);
      }
    }, 150);
  };

  const handleIntegrateGap = (gap: SearchGap) => {
    track('micro_integration_started', { kind: gap.kind });
    setActiveDrawerGap(gap);
    setDrawerResolvedDiff(undefined);
    setDrawerOpen(true);
  };

  const handleViewResolvedGap = (gap: SearchGap) => {
    const meta = resolvedGapMetadata[gap.term.toLowerCase()];
    setActiveDrawerGap(gap);
    setDrawerResolvedDiff(meta);
    setDrawerOpen(true);
  };

  const handleApplyMicroIntegration = (applied: AppliedMicroIntegration) => {
    setActiveAnalysis(applied.analysis);
    onUpdateAnalysis?.(applied.analysis);

    if (activeDrawerGap?.kind) {
      track('micro_integration_applied', { kind: activeDrawerGap.kind, outcome: 'match' });
      track('gap_resolved', { kind: activeDrawerGap.kind, outcome: 'match' });
    }

    const termKey = activeDrawerGap?.term?.toLowerCase() || '';
    if (termKey) {
      setResolvedGapMetadata((prev) => ({
        ...prev,
        [termKey]: {
          before: applied.diff.before,
          after: applied.diff.after,
          evidenceText: activeDrawerGap?.evidence?.evidenceText,
          companyName: applied.diff.experienceId
            ? applied.analysis.rewritten.experiences.find(
                (e, idx) => (e.id || `exp-${idx}`) === applied.diff.experienceId,
              )?.companyName
            : undefined,
        },
      }));
    }
  };

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      if (key === 'headline') {
        track('copy_headline');
      } else if (key === 'summary') {
        track('copy_about');
      } else if (key.startsWith('exp')) {
        track('copy_experience');
      } else if (key === 'skills') {
        track('copy_skills');
      }
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const generateFullMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${originalProfile.firstName} ${originalProfile.lastName}`);
    lines.push(`**${activeAnalysis.rewritten.headline}**`);
    lines.push(`\n## Summary\n${activeAnalysis.rewritten.summary}`);
    lines.push('\n## Experience');
    for (const exp of activeAnalysis.rewritten.experiences) {
      lines.push(`\n### ${exp.title} | ${exp.companyName}`);
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
    lines.push('\n## Top Skills');
    lines.push(activeAnalysis.rewritten.skills.join(', '));
    return lines.join('\n');
  };

  // 5 Technical Criteria comparison (Before vs After)
  const criteriaBreakdown = [
    {
      id: 'searchRelevance',
      name: 'Relevância de Busca (Search Relevance)',
      description: 'Correspondência semântica e indexação booleana de palavras-chave técnicas do seu cargo.',
      icon: Search,
      before: initialReview?.scores?.searchRelevance ?? Math.max(30, Math.round(initialScore * 0.95)),
      after: activeAnalysis.scores.searchRelevance,
    },
    {
      id: 'humanVoice',
      name: 'Tom de Voz Humano (Human Voice)',
      description: 'Inglês americano nativo, naturalidade executiva e ausência de termos traduzidos ao pé da letra.',
      icon: Sparkles,
      before: initialReview?.scores?.humanVoice ?? Math.max(30, Math.round(initialScore * 1.05)),
      after: activeAnalysis.scores.humanVoice,
    },
    {
      id: 'credibility',
      name: 'Credibilidade Técnica (Credibility)',
      description: 'Sinal de senioridade inequívoca, decisões arquiteturais complexas e autonomia comprovada.',
      icon: ShieldCheck,
      before: initialReview?.scores?.credibility ?? Math.max(25, Math.round(initialScore * 0.9)),
      after: activeAnalysis.scores.credibility,
    },
    {
      id: 'positioningClarity',
      name: 'Clareza de Posicionamento (Positioning Clarity)',
      description: 'Headline limpa e focada em sistemas de alta escala, sem nichos inventados ou clichês.',
      icon: Target,
      before: initialReview?.scores?.positioningClarity ?? Math.max(25, Math.round(initialScore * 0.85)),
      after: activeAnalysis.scores.positioningClarity,
    },
    {
      id: 'evidenceCoverage',
      name: 'Cobertura de Evidências (Evidence Coverage)',
      description: 'Resultados comprovados com números, %, latência e escala no framework STAR/XYZ.',
      icon: BarChart3,
      before: initialReview?.scores?.evidenceCoverage ?? Math.max(25, Math.round(initialScore * 0.88)),
      after: activeAnalysis.scores.evidenceCoverage,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Action Hub Tabs (My Profile | Search | Launch) */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-center pb-2">
          <TabsList data-testid="action-hub-tabs-list" className="bg-[#090D14] border border-[#1E293B] p-1 rounded-2xl gap-2 h-12 shadow-lg">
            <TabsTrigger
              value="profile"
              className="px-6 py-2 text-xs sm:text-sm font-semibold gap-2 transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>My Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="px-6 py-2 text-xs sm:text-sm font-semibold gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger
              value="launch"
              className="px-6 py-2 text-xs sm:text-sm font-semibold gap-2 transition-all cursor-pointer"
            >
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>Launch</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: My Profile */}
        <TabsContent value="profile" forceMount className="space-y-8 mt-4">
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
                      {activeAnalysis.profileDirection.primaryRole || activeAnalysis.profileDirection.positioning}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Perfil Otimizado
                  </h1>
                  <FormattedText
                    text={activeAnalysis.executiveSummary}
                    as="p"
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                  />
                </div>
              </div>

              {/* Authoritative Score Evolution Block */}
              <div className="flex items-center gap-4 bg-[#090D14]/90 p-4 sm:p-5 rounded-2xl border border-[#1E293B] shadow-lg flex-shrink-0 w-full sm:w-auto justify-center">
                <div className="text-center min-w-[56px]">
                  <span className="text-xs text-slate-400 block font-medium">Antes</span>
                  <span className="text-3xl sm:text-4xl font-bold text-rose-400 font-mono tracking-tight">
                    {initialScore}
                  </span>
                  <span className="text-[11px] text-slate-500 block">/ 100</span>
                </div>

                <div className="flex flex-col items-center px-2">
                  <span className="text-slate-600 text-base sm:text-lg font-bold">➔</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                    {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pontos
                  </span>
                </div>

                <div className="text-center min-w-[56px]">
                  <span className="text-xs text-emerald-400 block font-medium">Depois</span>
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
                className="w-full sm:w-auto font-semibold gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
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

          {/* Persistent Next Step Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0 mt-0.5 sm:mt-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Próximo passo: Finalize sua configuração no LinkedIn
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ative os 5 títulos do Open to Work invisível e checklist de 6 etapas no Launch Center.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleTabChange('launch')}
              className="w-full sm:w-auto font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0 cursor-pointer gap-1.5"
            >
              <span>Abrir Launch Center →</span>
            </Button>
          </div>

          {/* Recruiter Search Card Hero (Antes vs Depois) */}
          <RecruiterSearchCard
            originalProfile={originalProfile}
            rewrittenHeadline={activeAnalysis.rewritten.headline}
            primaryRole={activeAnalysis.profileDirection.primaryRole}
            badges={activeAnalysis.rewritten.cardConversionBadges}
            reasons={activeAnalysis.rewritten.cardConversionReasons}
          />

          {/* 5 Technical Criteria Horizontal Ruler */}
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

          {/* Comparative Tabs in Full Width (Before vs After) */}
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

            <Tabs value={innerCopyTab} onValueChange={setInnerCopyTab}>
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-11 bg-[#090D14] border border-[#1E293B] p-1 rounded-xl">
                <TabsTrigger value="headline" className="text-xs sm:text-sm gap-2">
                  <FileText className="w-4 h-4" /> Headline
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-xs sm:text-sm gap-2">
                  <FileText className="w-4 h-4" /> About / Summary
                </TabsTrigger>
                <TabsTrigger value="experiences" className="text-xs sm:text-sm gap-2">
                  <Briefcase className="w-4 h-4" /> Experiências ({activeAnalysis.rewritten.experiences.length})
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs sm:text-sm gap-2">
                  <Layers className="w-4 h-4" /> Skills ({activeAnalysis.rewritten.skills.length})
                </TabsTrigger>
              </TabsList>

              {/* Headline Tab */}
              <TabsContent value="headline" className="space-y-4">
                <HeadlineSection
                  originalHeadline={originalProfile.headline}
                  rewrittenHeadline={activeAnalysis.rewritten.headline}
                  onCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="summary" className="space-y-4">
                <AboutSection
                  originalSummary={originalProfile.summary}
                  rewrittenSummary={activeAnalysis.rewritten.summary}
                  onCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </TabsContent>

              {/* Experiences Tab */}
              <TabsContent value="experiences" className="space-y-4">
                <ExperienceSection
                  originalExperiences={originalProfile.experiences}
                  rewrittenExperiences={activeAnalysis.rewritten.experiences}
                  onCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-4">
                <SkillsSection
                  originalSkills={originalProfile.skills}
                  rewrittenSkills={activeAnalysis.rewritten.skills}
                  onCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Interview Preparation Guide Card */}
          <div className="w-full">
            <InterviewGuideCard />
          </div>
        </TabsContent>

        {/* Tab 2: Search (Dedicated RecruiterSearchSimulator exclusively) */}
        <TabsContent value="search" forceMount className="space-y-6 mt-4">
          <RecruiterSearchSimulator
            primaryRole={activeAnalysis.profileDirection.primaryRole || 'Senior Software Engineer'}
            rewrittenHeadline={activeAnalysis.rewritten.headline}
            rewrittenSummary={activeAnalysis.rewritten.summary}
            rewrittenSkills={activeAnalysis.rewritten.skills}
            rewrittenExperiences={activeAnalysis.rewritten.experiences}
            onFixGap={handleFixGap}
            onIntegrateGap={handleIntegrateGap}
            onViewResolvedGap={handleViewResolvedGap}
            resolvedGapMetadata={resolvedGapMetadata}
          />
        </TabsContent>

        {/* Tab 3: Launch (Dedicated LinkedInLaunchChecklist exclusively) */}
        <TabsContent value="launch" forceMount className="space-y-6 mt-4">
          <LinkedInLaunchChecklist
            primaryRole={activeAnalysis.profileDirection.primaryRole}
            alternativeRoles={activeAnalysis.profileDirection.alternativeRoles}
            openToWorkTitles={activeAnalysis.rewritten.openToWorkTitles || activeAnalysis.profileDirection.openToWorkTitles}
          />
        </TabsContent>
      </Tabs>

      {/* Contextual Gap Resolution Drawer */}
      <GapResolutionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        gap={activeDrawerGap}
        analysis={activeAnalysis}
        targetRole={activeAnalysis.profileDirection.primaryRole}
        aiProvider={aiProvider}
        onApplyPatch={handleApplyMicroIntegration}
        resolvedDiff={drawerResolvedDiff}
      />

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
          className="w-full sm:w-auto text-xs border-[#1E293B] hover:bg-slate-800 text-slate-200 cursor-pointer"
        >
          Iniciar novo perfil
        </Button>
      </div>
    </div>
  );
}
