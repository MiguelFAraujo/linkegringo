import React, { useState } from 'react';
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
} from 'lucide-react';
import type { Profile, ProfileReview } from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';
import { CandidateAvatar } from './ui/candidate-avatar';

const isTriageInquiry = (issue: string) =>
  issue.startsWith('Ponto de atenção') ||
  issue.toLowerCase().includes('ponto de atenção');

interface DiagnosticViewProps {
  profile: Profile;
  review: ProfileReview;
  targetRole?: string;
  onProceedToInterview?: (chosenRole?: string) => void;
  onProceedToObjective?: () => void;
}

export function DiagnosticView({
  profile,
  review,
  targetRole,
  onProceedToInterview,
  onProceedToObjective,
}: DiagnosticViewProps) {
  const isApprovedUSLevel = review.overallScore >= 90;

  const [selectedRole, setSelectedRole] = useState(
    targetRole || review.profileDirection?.primaryRole || 'Senior Software Engineer',
  );
  const [viewAllCritique, setViewAllCritique] = useState(false);

  const handleProceed = () => {
    if (onProceedToInterview) {
      onProceedToInterview(selectedRole);
    } else if (onProceedToObjective) {
      onProceedToObjective();
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Perfil Aprovado para Triagem nos EUA';
    if (score >= 70) return 'Perfil Competitivo com Ajustes Pontuais';
    if (score >= 55) return 'Perfil Razoável com Pontos Críticos de Atenção';
    if (score >= 40) return 'Baixo Sinal de Senioridade para o Mercado dos EUA';
    return 'Desalinhado com Recrutadores Técnicos dos EUA';
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

  const candidateFullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidato';

  const alternativeRoles = review.profileDirection?.alternativeRoles || [];
  const allRoleOptions = Array.from(
    new Set([selectedRole, review.profileDirection?.primaryRole, ...alternativeRoles].filter(Boolean) as string[]),
  );

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* 92+ Approved Dossier Banner */}
      {isApprovedUSLevel && (
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Perfil Aprovado para Triagem nos EUA
                </span>
                <span className="text-xs font-medium text-emerald-400">
                  Nota {review.overallScore}/100
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Seu perfil já cumpre os padrões de contratação dos EUA, com forte tração técnica e métricas comprovadas. A etapa a seguir servirá para lapidar detalhes arquiteturais na entrevista.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={handleProceed}
            className="w-full sm:w-auto font-semibold text-xs flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 cursor-pointer"
          >
            <span>Lapidar Detalhes & Avançar</span>
          </Button>
        </div>
      )}

      {/* Candidate Executive Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1623]/80">
        <div className="flex items-center gap-4">
          <CandidateAvatar
            publicId={profile.publicId}
            name={candidateFullName}
            size="lg"
            className="ring-1 ring-[#1E293B]"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
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
            <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
              {profile.headline || 'Sem título cadastrado'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
              <span>Cargo-alvo: <strong className="text-slate-200">{selectedRole}</strong></span>
              {profile.location && <span>• {profile.location}</span>}
            </div>
          </div>
        </div>

        <Button
          variant="default"
          onClick={handleProceed}
          className="w-full sm:w-auto font-medium text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
        >
          <span>{isApprovedUSLevel ? 'Lapidar Perfil' : 'Otimizar Perfil'}</span>
        </Button>
      </div>

      {/* Main Executive Dossier Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-5): Score, Parecer, Cargos Alternativos & Resumo Geral */}
        <div className="lg:col-span-5 flex flex-col p-6 rounded-2xl bg-[#0F1623]/80 border border-[#1E293B] space-y-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090D14] text-slate-300 text-xs font-medium border border-[#1E293B] self-start">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Diagnóstico do Perfil</span>
          </div>

          {/* Authoritative Score Block */}
          <div className="p-5 rounded-xl bg-[#090D14]/70 border border-[#1E293B] space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-white">{review.overallScore}</span>
              <span className="text-slate-500 text-base font-medium">/ 100</span>
            </div>
            <div className="font-semibold text-sm sm:text-base text-slate-200">
              {getScoreLabel(review.overallScore)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Avaliado com base no padrão de contratação de empresas de tecnologia dos EUA.
            </p>
          </div>

          {/* Next Steps Takeaway Note */}
          <div className="p-3.5 rounded-xl bg-[#090D14]/50 border border-[#1E293B] text-left flex items-start gap-2.5">
            {isApprovedUSLevel ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  <strong>Excelente base:</strong> Seu perfil cumpre os requisitos essenciais. Na entrevista, faremos perguntas de lapidação para maximizar precisão e converter em propostas de alto nível.
                </p>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Próxima etapa:</strong> A entrevista técnica de aprofundamento extrairá métricas e arquitetura para elevar sua nota ao padrão internacional.
                </p>
              </>
            )}
          </div>

          {/* Recommended Positioning & Tactical Role Switcher In-line */}
          {review.profileDirection && (
            <div className="p-4 rounded-xl bg-[#090D14]/70 border border-[#1E293B] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-semibold text-blue-400">
                  Posicionamento Recomendado
                </span>
                <span className="text-xs text-slate-400">
                  Cargo ativo: <strong className="text-white">{selectedRole}</strong>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {review.profileDirection.positioning}
              </p>
              <FormattedText
                text={review.profileDirection.rationale}
                as="p"
                className="text-xs text-slate-400 leading-relaxed"
              />

              {allRoleOptions.length > 1 && (
                <div className="pt-2.5 border-t border-[#1E293B] space-y-1.5">
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
          )}

          {/* Executive Summary */}
          <div className="pt-4 border-t border-[#1E293B] space-y-2">
            <span className="text-xs font-medium text-slate-400 block">
              Diagnóstico geral
            </span>
            <FormattedText
              text={review.executiveSummary}
              as="p"
              className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#090D14]/50 p-3.5 rounded-xl border border-[#1E293B]"
            />
          </div>

          {/* Triage Bottlenecks — US Tech Recruiter Screen */}
          {review.triageBottlenecks && review.triageBottlenecks.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2.5 text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  Gargalos de Triagem (Filtro Recrutadores EUA)
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  {review.triageBottlenecks.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pontos que causam descarte imediato na triagem de 6 segundos de recrutadores americanos:
              </p>
              <ul className="space-y-1.5 pt-1">
                {review.triageBottlenecks.map((bottleneck, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{bottleneck}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column (lg:col-span-7): Matriz dos 5 Critérios Técnicos */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F1623]/80 border border-[#1E293B] space-y-5">
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Critérios de Avaliação Técnica
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Avaliação pilar por pilar e o delta necessário para atingir o padrão internacional.
            </p>
          </div>

          {/* Clean Criteria Bars with Proportional Spacing and Delas in Portuguese */}
          <div className="space-y-3.5">
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
      </div>

      {/* Section by Section Critique (Linear Insights Tabbed Inspector) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Detalhamento por Seção do Perfil</span>
              <Badge variant="outline" className="text-xs font-normal text-slate-400 border-[#1E293B]">
                {review.critique.length} seções analisadas
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria técnica estruturada com severidade de red flags e evidências identificadas.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(review.critique || []).map((item, idx) => {
              const issues = item.issues || [];
              const strengths = item.strengths || [];
              const hasNoRedFlags = issues.length === 0;
              const hasOnlyTriage = issues.length > 0 && issues.every(isTriageInquiry);
              const hasRedFlags = issues.some((i) => !isTriageInquiry(i));

              return (
                <div key={idx} className="p-6 rounded-2xl border border-[#1E293B] bg-[#0F1623]/80 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-white">{item.section}</h3>
                    {hasNoRedFlags ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Sem Red Flags
                      </span>
                    ) : hasOnlyTriage ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border border-amber-500/40 bg-amber-950/20 text-amber-300">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        Ponto de Atenção
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
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
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#090D14]/60 p-3.5 rounded-xl border border-[#1E293B]"
                  />

                  {issues.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className={`text-xs font-medium block ${hasRedFlags ? 'text-rose-400' : 'text-amber-400'}`}>
                        {hasRedFlags ? 'Red Flags Identificadas:' : 'Pontos de Atenção na Triagem:'}
                      </span>
                      {issues.map((issue, i) => {
                        const isTriage = isTriageInquiry(issue);
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                            {isTriage ? (
                              <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                            )}
                            <FormattedText text={issue} as="span" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {strengths.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-medium text-emerald-400 block">
                        Pontos Fortes:
                      </span>
                      {strengths.map((str, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
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
                  <TabsTrigger
                    key={idx}
                    value={item.section}
                    className="gap-2 text-xs sm:text-sm py-2 px-3.5"
                  >
                    <span>{item.section}</span>
                    {hasNoRedFlags ? (
                      <span className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" title="Sem red flags">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    ) : hasOnlyTriage ? (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-300"
                        title="Ponto de atenção na triagem"
                      >
                        Ponto de Atenção
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
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
                  className="p-6 sm:p-7 rounded-2xl border border-[#1E293B] bg-[#0F1623]/80 space-y-6 shadow-xl"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-white">{item.section}</h3>
                      <p className="text-xs text-slate-400">Auditoria detalhada da seção</p>
                    </div>

                    {hasNoRedFlags ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Sem Red Flags
                      </span>
                    ) : hasOnlyTriage ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-950/30 text-amber-300">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        Ponto de Atenção na Triagem
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
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

                  {/* Technical Assessment */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-slate-400 block">
                      Parecer Técnico da IA:
                    </span>
                    <FormattedText
                      text={item.assessment}
                      as="p"
                      className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#090D14]/70 p-4 rounded-xl border border-[#1E293B]"
                    />
                  </div>

                  {/* 2-Column Findings Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Red Flags / Triage Inquiries Column */}
                    {issues.length > 0 ? (
                      <div className={`space-y-3 p-4 rounded-xl border ${
                        hasRedFlags
                          ? 'bg-rose-950/10 border-rose-500/20'
                          : 'bg-amber-950/10 border-amber-500/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                            hasRedFlags ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {hasRedFlags ? <XCircle className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                            {hasRedFlags ? 'Red Flags Identificadas:' : 'Pontos de Atenção na Triagem:'}
                          </span>
                          <span className={`text-[11px] font-mono ${hasRedFlags ? 'text-rose-400/80' : 'text-amber-400/80'}`}>
                            {issues.length} {issues.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {issues.map((issue, i) => {
                            const isTriage = isTriageInquiry(issue);
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                                <span className={`${isTriage ? 'text-amber-400' : 'text-rose-400'} font-bold`}>•</span>
                                <FormattedText text={issue} as="span" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-300">Nenhum red flag nesta seção</p>
                          <p className="text-[11px] text-slate-400">Conteúdo estruturado e sem ruídos detectados.</p>
                        </div>
                      </div>
                    )}

                    {/* Strengths Column (Only rendered if strengths exist) */}
                    {strengths.length > 0 && (
                      <div className="space-y-3 p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pontos Fortes:
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400/80">
                            {strengths.length} {strengths.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {strengths.map((str, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
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

      {/* Bottom Dossier Action Footer (Largura Total Ancorada) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#0F1623]/90 border border-[#1E293B]">
        <div className="space-y-1">
          <h2 className="font-semibold text-white text-sm sm:text-base">
            Próxima etapa: Entrevista de aprofundamento
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isApprovedUSLevel
              ? 'Refinar nuances arquiteturais e métricas de produção para maximizar a conversão de entrevistas.'
              : `Aprofundar suas conquistas técnicas para o cargo de ${selectedRole} e eliminar as lacunas identificadas.`}
          </p>
        </div>

        <Button
          variant="default"
          size="lg"
          onClick={handleProceed}
          className="w-full sm:w-auto font-semibold bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0 px-6 h-11 rounded-xl shadow-sm cursor-pointer"
        >
          <span>{isApprovedUSLevel ? 'Lapidar detalhes na entrevista' : 'Avançar para a entrevista'}</span>
        </Button>
      </div>
    </div>
  );
}
