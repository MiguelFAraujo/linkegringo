import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
  Compass,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { Profile, ProfileReview } from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';
import { CandidateAvatar } from './ui/candidate-avatar';

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
  const isApprovedUSLevel = review.overallScore >= 92;

  const [selectedRole, setSelectedRole] = useState(
    targetRole || review.profileDirection?.primaryRole || 'Senior Software Engineer',
  );

  const handleProceed = () => {
    if (onProceedToInterview) {
      onProceedToInterview(selectedRole);
    } else if (onProceedToObjective) {
      onProceedToObjective();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 92) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20';
    if (score >= 70) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10';
    if (score >= 55) return 'text-blue-400 border-blue-500/30 bg-blue-950/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-950/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/10';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 92) return 'Perfil Aprovado para Vagas nos EUA';
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* 92+ Approved Banner (Zero Emojis, Studio Engineering Look) */}
      {isApprovedUSLevel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="success"
                  className="text-xs font-semibold py-0.5 px-2.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Perfil Aprovado para Vagas nos EUA
                </Badge>
                <span className="text-xs font-mono font-semibold text-emerald-400">
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
            className="w-full sm:w-auto font-bold gap-2 text-xs flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60"
          >
            <span>Lapidar Detalhes & Avançar</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Integrated Executive Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg">
        <div className="flex items-center gap-4">
          <CandidateAvatar
            publicId={profile.publicId}
            name={candidateFullName}
            size="lg"
            className="ring-2 ring-slate-800"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {candidateFullName}
              </h2>
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Perfil Extraído
              </Badge>
              {isApprovedUSLevel && (
                <Badge
                  variant="success"
                  className="text-xs font-semibold py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Aprovado
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {profile.headline || 'Sem título cadastrado'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Cargo Alvo: <strong className="text-slate-300">{selectedRole}</strong></span>
              {profile.location && <span>• {profile.location}</span>}
            </div>
          </div>
        </div>

        <Button
          variant="default"
          onClick={handleProceed}
          className="w-full sm:w-auto font-semibold gap-2 shadow-lg bg-blue-600 hover:bg-blue-500 text-white"
        >
          <span>{isApprovedUSLevel ? 'Lapidar Perfil' : 'Otimizar Perfil'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Score & Technical Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score Card */}
        <Card className="md:col-span-5 flex flex-col justify-between p-6 bg-slate-900/80 border-slate-800">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              Diagnóstico do Perfil
            </div>

            <div className="relative py-2">
              <div
                className={`w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center border-4 shadow-xl ${getScoreColor(
                  review.overallScore,
                )}`}
              >
                <span className="text-5xl font-black tracking-tight font-mono">{review.overallScore}</span>
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  de 100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {isApprovedUSLevel && (
                <div className="mb-2">
                  <Badge
                    variant="success"
                    className="text-xs font-semibold py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1 mx-auto w-fit"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Perfil Aprovado para Vagas nos EUA
                  </Badge>
                </div>
              )}
              <h3 className="font-bold text-base text-white">{getScoreLabel(review.overallScore)}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Avaliado com base no padrão de contratação de empresas de tecnologia dos EUA.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            {isApprovedUSLevel ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  <strong>Excelente base:</strong> Seu perfil cumpre os requisitos essenciais. Na entrevista, faremos perguntas de lapidação para maximizar precisão e converter em propostas de alto nível.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/90 leading-relaxed">
                  <strong>Próxima etapa:</strong> A entrevista técnica de aprofundamento extrairá métricas e arquitetura para elevar sua nota ao padrão internacional.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Criteria Breakdown with Detailed Score Explanations */}
        <Card className="md:col-span-7 p-6 space-y-5 bg-slate-900/80 border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Critérios de Avaliação Técnica
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Avaliação pilar por pilar e o delta necessário para atingir 100%.
            </p>
          </div>

          {/* Criteria bars with detailed explanations */}
          <div className="space-y-4">
            {criteria.map((c) => (
              <div key={c.key} className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-200 font-medium">{c.label}</span>
                  <div className="flex items-center gap-2">
                    {c.value < 100 ? (
                      <span className="text-slate-400 text-[11px] font-mono">
                        (Faltam {100 - c.value}% para 100%)
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] font-mono font-medium">
                        (100% atingido)
                      </span>
                    )}
                    <span className="text-slate-300 font-mono font-bold">{c.value}%</span>
                  </div>
                </div>
                <Progress
                  value={c.value}
                  indicatorClassName={
                    c.value >= 75
                      ? 'bg-emerald-500'
                      : c.value >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }
                />
                {c.explanation ? (
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    {c.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Diagnóstico Geral
            </h4>
            <FormattedText
              text={review.executiveSummary}
              as="p"
              className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80"
            />
          </div>

          {/* Interactive Positioning Card with 1-Click Role Switcher */}
          {review.profileDirection && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Posicionamento Recomendado
                </span>
                <span className="text-[11px] text-slate-400">
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
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Alternativas de cargo (clique para alternar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allRoleOptions.map((role) => {
                      const isSelected = selectedRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 font-medium shadow-sm'
                              : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Section by Section Critique (Editorial Format) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Detalhamento por Seção do Perfil</span>
            <Badge variant="outline" className="text-xs font-normal text-slate-400">
              {review.critique.length} seções analisadas
            </Badge>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(review.critique || []).map((item, idx) => {
            const issues = item.issues || [];
            const strengths = item.strengths || [];
            const hasNoRedFlags = issues.length === 0;

            return (
              <Card key={idx} className="p-4 border-slate-800 bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm sm:text-base text-white">{item.section}</h4>
                  {hasNoRedFlags ? (
                    <Badge
                      variant="success"
                      className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Sem Red Flags
                    </Badge>
                  ) : (
                    <Badge
                      variant={
                        item.severity === 'high'
                          ? 'destructive'
                          : item.severity === 'medium'
                          ? 'warning'
                          : 'outline'
                      }
                      className="text-xs font-mono font-semibold"
                    >
                      {item.severity === 'high' ? 'Grave' : item.severity === 'medium' ? 'Moderado' : 'Leve'}
                    </Badge>
                  )}
                </div>

                <FormattedText
                  text={item.assessment}
                  as="p"
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                />

                {issues.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                      Red Flags Identificadas:
                    </span>
                    {issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <FormattedText text={issue} as="span" />
                      </div>
                    ))}
                  </div>
                )}

                {strengths.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                      Pontos Fortes:
                    </span>
                    {strengths.map((str, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <FormattedText text={str} as="span" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-0.5">
          <h4 className="font-bold text-white text-sm sm:text-base">
            Próxima etapa: Entrevista de aprofundamento
          </h4>
          <p className="text-xs text-slate-400">
            {isApprovedUSLevel
              ? 'Refinar nuances arquiteturais e métricas de produção para maximizar a conversão de entrevistas.'
              : `Aprofundar suas conquistas técnicas para o cargo de ${selectedRole} e eliminar as lacunas identificadas.`}
          </p>
        </div>

        <Button
          variant="default"
          size="lg"
          onClick={handleProceed}
          className="w-full sm:w-auto gap-2 font-bold shadow-lg bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0"
        >
          <span>{isApprovedUSLevel ? 'Lapidar detalhes na entrevista' : 'Avançar para a entrevista'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
