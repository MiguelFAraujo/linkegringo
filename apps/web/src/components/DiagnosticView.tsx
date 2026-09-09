import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Check,
  Sparkles,
  Compass,
  Layers,
  LayoutGrid,
  AlertTriangle,
  LockOpen,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  type Profile,
  type ProfileReview,
  type ProfileGap,
  calculateInboundReadiness,
  calculateInboundJourney,
  getInboundReadinessClassification,
} from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';
import { CandidateAvatar } from './ui/candidate-avatar';
import { track, toScoreBand } from '@/lib/telemetry';

const isTriageInquiry = (issue: string) =>
  issue.startsWith('Ponto de atenção') ||
  issue.toLowerCase().includes('ponto de atenção');

interface DiagnosticViewProps {
  profile: Profile;
  review: ProfileReview;
  targetRole?: string;
  onProceedToInterview?: (chosenRole?: string) => void;
  onProceedToObjective?: () => void;
  defaultExpanded?: boolean;
  isProcessing?: boolean;
}

function deriveGaps(review: ProfileReview): ProfileGap[] {
  if (review.primaryGaps && review.primaryGaps.length > 0) {
    return review.primaryGaps;
  }
  const gaps: ProfileGap[] = [];

  if (review.triageBottlenecks && review.triageBottlenecks.length > 0) {
    review.triageBottlenecks.forEach((b, i) => {
      const isHeadline = /headline|título|posicionamento/i.test(b);
      const isExp = /métrica|xyz|resultado|latência|escala/i.test(b);
      gaps.push({
        id: `gap-bottleneck-${i}`,
        label: isHeadline
          ? 'Ajuste de Título & Posicionamento Semântico'
          : isExp
          ? 'Quantificação de Métricas e Escala (Framework XYZ)'
          : 'Remoção de Red Flags de Triagem',
        targetSection: isHeadline ? 'headline' : isExp ? 'experience' : 'about',
        targetBlockId: isHeadline
          ? 'profile-section-headline'
          : isExp
          ? 'profile-section-experience'
          : 'profile-section-about',
        suggestedUnlock: isHeadline
          ? 'Alinhar título ao cargo de contratação dos EUA sem termos genéricos.'
          : isExp
          ? 'Reescrever realizações com mecanismo técnico e resultados quantificáveis.'
          : 'Eliminar pontos de fricção na triagem técnica americana.',
      });
    });
  }

  if (review.critique && review.critique.length > 0) {
    review.critique.forEach((c) => {
      if (c.issues && c.issues.length > 0) {
        const sec = c.section.toLowerCase();
        const targetSection = sec.includes('head')
          ? 'headline'
          : sec.includes('exp')
          ? 'experience'
          : sec.includes('skill')
          ? 'skills'
          : 'about';
        gaps.push({
          id: `gap-critique-${targetSection}`,
          label: `Refinamento da seção ${c.section}`,
          targetSection,
          targetBlockId: `profile-section-${targetSection}`,
          suggestedUnlock: `Lapidar a estrutura da seção ${c.section} para fortalecer os sinais de senioridade técnica.`,
        });
      }
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      id: 'gap-default-1',
      label: 'Aprofundamento de Métricas e Arquitetura de Produção',
      targetSection: 'experience',
      targetBlockId: 'profile-section-experience',
      suggestedUnlock: 'Quantificar volume de requisições, latência p99 e impacto das decisões arquiteturais.',
    });
  }

  const seen = new Set<string>();
  return gaps.filter((g) => {
    const key = `${g.targetSection}:${g.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function DiagnosticView({
  profile,
  review,
  targetRole,
  onProceedToInterview,
  onProceedToObjective,
  defaultExpanded = false,
  isProcessing = false,
}: DiagnosticViewProps) {
  // Inbound score prioritization: review.inboundReadiness?.score ?? calculateInboundReadiness(review.scores) ?? review.overallScore
  const calculatedInboundScore = review.scores ? calculateInboundReadiness(review.scores) : undefined;
  const inboundScore =
    review.inboundReadiness?.score ??
    calculatedInboundScore ??
    review.overallScore ??
    0;

  const isApprovedUSLevel = inboundScore >= 90;

  const [selectedRole, setSelectedRole] = useState(
    targetRole || review.profileDirection?.primaryRole || 'Senior Software Engineer',
  );
  const [viewAllCritique, setViewAllCritique] = useState(false);
  const [showSecondaryUnlocks, setShowSecondaryUnlocks] = useState(false);

  const derivedGaps = deriveGaps(review);
  const journey = calculateInboundJourney(review.scores, derivedGaps);
  const classification = getInboundReadinessClassification(inboundScore);

  const primaryGapId = review.inboundReadiness?.primaryGapId;
  const biggestUnlock =
    (primaryGapId ? derivedGaps.find((g) => g.id === primaryGapId) : undefined) ?? derivedGaps[0];
  const secondaryUnlocks = derivedGaps.filter((g) => g.id !== biggestUnlock?.id).slice(0, 2);

  useEffect(() => {
    track('diagnosis_viewed', { scoreBand: toScoreBand(inboundScore) });
  }, [inboundScore]);

  const handleProceed = () => {
    if (onProceedToInterview) {
      onProceedToInterview(selectedRole);
    } else if (onProceedToObjective) {
      onProceedToObjective();
    }
  };

  const criteria = [
    {
      key: 'searchRelevance' as const,
      label: 'Relevância de Busca (ATS / Recrutadores)',
      value: review.scores.searchRelevance,
      explanation: review.scoreExplanations?.searchRelevance,
    },
    {
      key: 'positioningClarity' as const,
      label: 'Clareza de Posicionamento',
      value: review.scores.positioningClarity,
      explanation: review.scoreExplanations?.positioningClarity,
    },
    {
      key: 'credibility' as const,
      label: 'Credibilidade Técnica',
      value: review.scores.credibility,
      explanation: review.scoreExplanations?.credibility,
    },
    {
      key: 'evidenceCoverage' as const,
      label: 'Cobertura de Evidências & Métricas',
      value: review.scores.evidenceCoverage,
      explanation: review.scoreExplanations?.evidenceCoverage,
    },
    {
      key: 'humanVoice' as const,
      label: 'Tom de Voz Profissional',
      value: review.scores.humanVoice,
      explanation: review.scoreExplanations?.humanVoice,
    },
  ];

  // Derive 2 Strong vs 2 To Improve based on pillar performance
  const sortedCriteria = [...criteria].sort((a, b) => b.value - a.value);
  const strongPoints = sortedCriteria
    .slice(0, 2)
    .map((c) => `${c.label} (${c.value}%): Forte tração no mercado internacional.`);
  const improvePoints = sortedCriteria
    .slice(-2)
    .reverse()
    .map((c) => `${c.label} (${c.value}%): Oportunidade prioritária de lapidação na entrevista.`);

  const candidateFullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidato';
  const alternativeRoles = review.profileDirection?.alternativeRoles || [];
  const allRoleOptions = Array.from(
    new Set([selectedRole, review.profileDirection?.primaryRole, ...alternativeRoles].filter(Boolean) as string[]),
  );

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 90+ Celebratory Banner (informative banner for US-level profiles) */}
      {isApprovedUSLevel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 flex-shrink-0 mt-0.5 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Perfil Aprovado para Triagem nos EUA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Seu perfil já cumpre os padrões de contratação dos EUA, com forte tração técnica e métricas comprovadas. A etapa a seguir servirá para lapidar detalhes arquiteturais na entrevista.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Executive Header (Minimalist & Compact) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1623]/80">
        <div className="flex items-center gap-3.5">
          <CandidateAvatar
            publicId={profile.publicId}
            name={candidateFullName}
            size="md"
            className="ring-1 ring-[#1E293B]"
          />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {candidateFullName}
              </h1>
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 font-normal flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Perfil Extraído
              </Badge>
              {isApprovedUSLevel && (
                <Badge
                  variant="success"
                  className="text-xs font-medium py-0.5 px-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Perfil Aprovado para Triagem nos EUA
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {profile.headline || 'Sem título cadastrado'}
            </p>
          </div>
        </div>

        {/* Header Status Label */}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#090D14] border border-[#1E293B] text-slate-300 self-start sm:self-auto">
          Diagnóstico do Perfil
        </span>
      </div>

      {/* Step 2 Minimal Single-Screen Viewport Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#1E293B] bg-gradient-to-b from-[#0F1623] to-[#090D14] shadow-2xl space-y-6">
        {/* 1. Exactly 1 Public Overall Score: Inbound Readiness (XX / 100) */}
        <div
          data-testid="inbound-readiness-score"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Inbound Readiness
              </span>
              <Badge
                variant={classification.status === 'ready' ? 'success' : 'outline'}
                className={`text-[11px] font-semibold py-0.5 px-2 ${
                  classification.status === 'ready'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : classification.status === 'needs_attention'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {classification.label}
              </Badge>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {classification.classification}
            </h2>
            <p className="text-xs text-slate-400">
              Cargo avaliado: <strong className="text-slate-200">{selectedRole}</strong>
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-[#090D14]/90 px-5 py-3 rounded-2xl border border-[#1E293B] shadow-lg self-stretch sm:self-auto justify-center">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-mono">
              {inboundScore}
            </span>
            <span className="text-slate-500 text-sm font-medium">/ 100</span>
          </div>
        </div>

        {/* 2. Horizontal Journey Pipeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Jornada Inbound no LinkedIn</span>
            <span className="text-[11px] text-slate-500 font-mono">Pipeline de Conversão</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-xl bg-[#090D14]/80 border border-[#1E293B]">
            {/* Stage 1: Busca */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-slate-200">Busca</span>
              <span className={`text-xs font-mono font-bold ${
                journey.search.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                ({journey.search.score} {journey.search.status === 'ready' ? '✓' : '!'})
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600 font-mono">──</span>

            {/* Stage 2: Card */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-slate-200">Card</span>
              <span className={`text-xs font-mono font-bold ${
                journey.card.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                ({journey.card.score} {journey.card.status === 'ready' ? '✓' : '!'})
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600 font-mono">──</span>

            {/* Stage 3: Perfil */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-slate-200">Perfil</span>
              <span className={`text-xs font-mono font-bold ${
                journey.profile.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                ({journey.profile.score} {journey.profile.status === 'ready' ? '✓' : '!'})
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600 font-mono">──</span>

            {/* Stage 4: InMail */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-slate-200">InMail</span>
              <span className="text-xs font-mono text-slate-500">(—)</span>
            </div>
          </div>
        </div>

        {/* 3. Your Biggest Unlock (O Seu Maior Desbloqueio) */}
        {biggestUnlock && (
          <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-950/15 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <LockOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Seu Maior Desbloqueio
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono text-blue-300 border-blue-500/30">
                {biggestUnlock.targetSection}
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {biggestUnlock.label}
              </h3>
              {biggestUnlock.suggestedUnlock && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {biggestUnlock.suggestedUnlock}
                </p>
              )}
            </div>

            {/* Progressive Disclosure: + X outros desbloqueios */}
            {secondaryUnlocks.length > 0 && (
              <div className="pt-2 border-t border-blue-500/20 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSecondaryUnlocks(!showSecondaryUnlocks)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>
                    {showSecondaryUnlocks
                      ? 'Ocultar desbloqueios secundários'
                      : `+ ${secondaryUnlocks.length} outros desbloqueios`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSecondaryUnlocks ? 'rotate-180' : ''}`} />
                </button>

                {showSecondaryUnlocks && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    {secondaryUnlocks.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#090D14]/70 border border-[#1E293B] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{gap.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{gap.targetSection}</span>
                        </div>
                        {gap.suggestedUnlock && (
                          <p className="text-slate-400 text-[11px] leading-relaxed">{gap.suggestedUnlock}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Microcopy & Single Dominant CTA */}
        <div className="pt-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-center sm:text-left">
              Já encontramos os principais desbloqueios. Agora vamos extrair as evidências reais para fortalecer seu perfil.
            </p>
            <button
              type="button"
              onClick={() => {
                const details = document.querySelector('details[data-testid="technical-diagnosis-disclosure"]') as HTMLDetailsElement;
                if (details) {
                  details.open = true;
                  details.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer flex-shrink-0 self-center sm:self-auto"
            >
              Ver diagnóstico técnico detalhado (5 pilares) ↓
            </button>
          </div>

          <Button
            type="button"
            variant="default"
            size="lg"
            data-testid="primary-cta"
            disabled={isProcessing}
            onClick={handleProceed}
            className="w-full font-bold text-sm sm:text-base bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white shadow-xl py-4 px-6 rounded-xl cursor-pointer flex items-center justify-center gap-2 group transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Gerando entrevista técnica...</span>
              </>
            ) : (
              <>
                <span>Continuar para a Entrevista Técnica →</span>
                <span className="sr-only">
                  {isApprovedUSLevel ? 'Lapidar Detalhes & Avançar' : 'Avançar para a entrevista'}
                </span>
                <span className="sr-only">
                  {isApprovedUSLevel ? 'Lapidar Perfil' : 'Otimizar Perfil'}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 5. Progressive Disclosure: "Por que essa nota?" (5 Technical Pillars & Detailed Critique) */}
      <details
        className="border border-[#1E293B] rounded-2xl bg-[#0F1623]/80 transition-all group overflow-hidden"
        data-testid="technical-diagnosis-disclosure"
        open={defaultExpanded}
      >
        <summary className="cursor-pointer p-4 sm:p-5 font-semibold text-xs sm:text-sm text-slate-300 flex items-center justify-between hover:text-white select-none list-none">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span>Por que essa nota?</span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              (Diagnóstico detalhado dos 5 critérios técnicos)
            </span>
          </div>
          <span className="text-xs text-blue-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="p-5 sm:p-6 border-t border-[#1E293B] space-y-6" data-testid="technical-pillars">
          {/* Staged: 2 Strong vs 2 To Improve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pontos Fortes (Top 2)
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {strongPoints.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/15 space-y-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Pontos a Melhorar (Top 2)
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {improvePoints.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5 Technical Criteria Breakdown */}
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400" />
                Critérios de Avaliação Técnica
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Avaliação pilar por pilar e o delta necessário para atingir o padrão internacional.
              </p>
            </div>

            <div className="space-y-3">
              {criteria.map((c) => (
                <div key={c.key} className="space-y-1.5 p-3.5 rounded-xl bg-[#090D14]/60 border border-[#1E293B]">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-200 font-medium">{c.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">
                        {c.value >= 95
                          ? c.value === 100
                            ? 'Padrão internacional atingido'
                            : 'Padrão de excelência atingido'
                          : `Faltam ${100 - c.value}% para o padrão internacional`}
                      </span>
                      <span className="text-slate-200 font-semibold">{c.value}%</span>
                    </div>
                  </div>
                  <Progress
                    value={c.value}
                    className="h-2 bg-slate-800/80"
                    indicatorClassName={
                      c.value >= 75
                        ? 'bg-emerald-500'
                        : c.value >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }
                  />
                  {c.explanation ? (
                    <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                      {c.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Section by Section Critique (Tabbed or Expanded) */}
          <div className="space-y-4 pt-2 border-t border-[#1E293B]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Detalhamento por Seção do Perfil</span>
                  <Badge variant="outline" className="text-xs font-normal text-slate-400 border-[#1E293B]">
                    {review.critique.length} seções analisadas
                  </Badge>
                </h3>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewAllCritique(!viewAllCritique)}
                className="text-xs text-slate-400 hover:text-white border border-[#1E293B] bg-[#090D14] h-8 px-3 gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{viewAllCritique ? 'Modo em Abas' : 'Expandir Todas as Seções'}</span>
              </Button>
            </div>

            {viewAllCritique ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(review.critique || []).map((item, idx) => {
                  const issues = item.issues || [];
                  const strengths = item.strengths || [];
                  const hasNoRedFlags = issues.length === 0;
                  const hasOnlyTriage = issues.length > 0 && issues.every(isTriageInquiry);
                  const hasRedFlags = issues.some((i) => !isTriageInquiry(i));

                  return (
                    <div key={idx} className="p-5 rounded-2xl border border-[#1E293B] bg-[#090D14]/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-xs sm:text-sm text-white">{item.section}</h4>
                        {hasNoRedFlags ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Sem Red Flags
                          </span>
                        ) : hasOnlyTriage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-amber-500/40 bg-amber-950/20 text-amber-300">
                            <HelpCircle className="w-3 h-3" /> Ponto de Atenção
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              item.severity === 'high'
                                ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                                : item.severity === 'medium'
                                ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                                : 'border-slate-700 bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            {item.severity === 'high' ? 'Grave' : item.severity === 'medium' ? 'Moderado' : 'Leve'}
                          </span>
                        )}
                      </div>

                      <FormattedText
                        text={item.assessment}
                        as="p"
                        className="text-xs text-slate-300 leading-relaxed bg-[#090D14]/60 p-3 rounded-xl border border-[#1E293B]"
                      />

                      {issues.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className={`text-[11px] font-medium block ${hasRedFlags ? 'text-rose-400' : 'text-amber-400'}`}>
                            {hasRedFlags ? 'Red Flags Identificadas:' : 'Pontos de Atenção na Triagem:'}
                          </span>
                          {issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                              <span className="text-rose-400 font-bold">•</span>
                              <FormattedText text={issue} as="span" />
                            </div>
                          ))}
                        </div>
                      )}

                      {strengths.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-medium text-emerald-400 block">Pontos Fortes:</span>
                          {strengths.map((str, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <FormattedText text={str} as="span" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Tabs defaultValue={review.critique[0]?.section || 'Headline'}>
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto bg-[#090D14] border border-[#1E293B] p-1.5 rounded-xl gap-2">
                  {review.critique.map((item, idx) => {
                    const issues = item.issues || [];
                    const hasNoRedFlags = issues.length === 0;
                    const hasOnlyTriage = issues.length > 0 && issues.every(isTriageInquiry);
                    return (
                      <TabsTrigger key={idx} value={item.section} className="gap-2 text-xs py-1.5 px-3">
                        <span>{item.section}</span>
                        {hasNoRedFlags ? (
                          <span className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        ) : hasOnlyTriage ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-300">
                            Ponto de Atenção
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${
                              item.severity === 'high'
                                ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                                : item.severity === 'medium'
                                ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                                : 'border-slate-700 bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.severity === 'high' ? 'Grave' : item.severity === 'medium' ? 'Moderado' : 'Leve'}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {review.critique.map((item, idx) => {
                  const issues = item.issues || [];
                  const strengths = item.strengths || [];
                  const hasNoRedFlags = issues.length === 0;
                  const hasOnlyTriage = issues.length > 0 && issues.every(isTriageInquiry);
                  const hasRedFlags = issues.some((i) => !isTriageInquiry(i));

                  return (
                    <TabsContent
                      key={idx}
                      value={item.section}
                      forceMount
                      className="p-5 rounded-2xl border border-[#1E293B] bg-[#090D14]/80 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                        <h4 className="font-bold text-sm sm:text-base text-white">{item.section}</h4>
                        {hasNoRedFlags ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sem Red Flags
                          </span>
                        ) : hasOnlyTriage ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border border-amber-500/40 bg-amber-950/30 text-amber-300">
                            <HelpCircle className="w-3.5 h-3.5" /> Ponto de Atenção na Triagem
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                              item.severity === 'high'
                                ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                                : item.severity === 'medium'
                                ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
                                : 'border-slate-700 bg-slate-800/60 text-slate-300'
                            }`}
                          >
                            Severidade: {item.severity === 'high' ? 'Grave' : item.severity === 'medium' ? 'Moderado' : 'Leve'}
                          </span>
                        )}
                      </div>

                      <FormattedText
                        text={item.assessment}
                        as="p"
                        className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#090D14]/70 p-3.5 rounded-xl border border-[#1E293B]"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {issues.length > 0 ? (
                          <div className={`space-y-2 p-3.5 rounded-xl border ${
                            hasRedFlags ? 'bg-rose-950/10 border-rose-500/20' : 'bg-amber-950/10 border-amber-500/20'
                          }`}>
                            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                              hasRedFlags ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {hasRedFlags ? <XCircle className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                              {hasRedFlags ? 'Red Flags Identificadas:' : 'Pontos de Atenção na Triagem:'}
                            </span>
                            <div className="space-y-1.5">
                              {issues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <span className="text-rose-400 font-bold">•</span>
                                  <FormattedText text={issue} as="span" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-500/20 flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-emerald-300">Nenhum red flag nesta seção</span>
                          </div>
                        )}

                        {strengths.length > 0 && (
                          <div className="space-y-2 p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-500/20">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pontos Fortes:
                            </span>
                            <div className="space-y-1.5">
                              {strengths.map((str, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <span className="text-emerald-400 font-bold">•</span>
                                  <FormattedText text={str} as="span" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </div>

          {/* Triage Bottlenecks if present */}
          {review.triageBottlenecks && review.triageBottlenecks.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  Gargalos de Triagem (Filtro Recrutadores EUA)
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  {review.triageBottlenecks.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pontos que causam descarte imediato na triagem de 6 segundos de recrutadores americanos:
              </p>
              <ul className="space-y-1 pt-1">
                {review.triageBottlenecks.map((bottleneck, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{bottleneck}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Role calibration if multiple roles available */}
          {allRoleOptions.length > 1 && (
            <div className="p-4 rounded-xl bg-[#090D14]/70 border border-[#1E293B] space-y-2">
              <span className="text-xs text-slate-400 block font-medium">
                Alternativas de cargo (clique para calibrar o diagnóstico):
              </span>
              <div className="flex flex-wrap gap-2">
                {allRoleOptions.map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 font-medium shadow-sm'
                          : 'bg-[#090D14] text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700 font-normal'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
