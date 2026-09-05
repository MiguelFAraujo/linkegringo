import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
  Compass,
  UserCheck,
  Sparkles,
  Award,
} from 'lucide-react';
import type { Profile, ProfileReview } from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';

interface DiagnosticViewProps {
  profile: Profile;
  review: ProfileReview;
  onProceedToObjective: () => void;
}

export function DiagnosticView({ profile, review, onProceedToObjective }: DiagnosticViewProps) {
  const isApprovedGringoLevel = review.overallScore >= 92;

  const getScoreColor = (score: number) => {
    if (score >= 92) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40 shadow-emerald-950/40';
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 55) return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 92) return 'Perfil Nível Gringo Aprovado (Padrão EUA)';
    if (score >= 70) return 'Perfil Competitivo, mas com Ajustes Necessários';
    if (score >= 55) return 'Perfil Razoável, mas com Gargalos Críticos';
    if (score >= 40) return 'Invisível ou com Baixo Sinal de Senioridade';
    return 'Gravemente Desalinhado com Recrutadores dos EUA';
  };

  const criteria = [
    { label: 'Relevância de Busca (ATS / Recrutadores)', value: review.scores.searchRelevance },
    { label: 'Clareza de Posicionamento', value: review.scores.positioningClarity },
    { label: 'Credibilidade Técnica', value: review.scores.credibility },
    { label: 'Cobertura de Evidências & Métricas', value: review.scores.evidenceCoverage },
    { label: 'Tom de Voz Profissional', value: review.scores.humanVoice },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* 92+ Approved Gringo Level Celebratory Banner */}
      {isApprovedGringoLevel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-emerald-900/40 to-slate-900 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="text-xs font-bold py-0.5 px-2.5 bg-emerald-500 text-slate-950 border-emerald-400">
                  🎉 Perfil Nível Gringo Aprovado
                </Badge>
                <span className="text-xs font-mono font-semibold text-emerald-300">
                  Nota {review.overallScore}/100
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Seu perfil já cumpre os padrões de contratação dos EUA! Você já possui forte tração técnica e métricas comprovadas. A etapa a seguir servirá para lapidar detalhes finos e maximizar ainda mais seu alinhamento com recrutadores internacionais.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={onProceedToObjective}
            className="w-full sm:w-auto font-bold gap-2 text-xs flex-shrink-0 shadow-lg shadow-emerald-950/60"
          >
            <span>Lapidar Detalhes</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Candidate Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/20">
            {profile.firstName?.[0] || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                <UserCheck className="w-3 h-3 mr-1" /> Perfil Extraído
              </Badge>
              {isApprovedGringoLevel && (
                <Badge variant="success" className="text-xs font-semibold py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  Aprovado
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {profile.headline || 'Sem título definido'}
            </p>
          </div>
        </div>

        <Button
          variant="default"
          onClick={onProceedToObjective}
          className="w-full sm:w-auto font-semibold gap-2 shadow-lg shadow-emerald-950/40"
        >
          <span>{isApprovedGringoLevel ? 'Lapidar Perfil' : 'Otimizar Perfil'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Score & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score Card */}
        <Card className="md:col-span-5 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              Raio-X Inicial do LinkedIn
            </div>

            <div className="relative py-2">
              <div
                className={`w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center border-4 shadow-xl ${getScoreColor(
                  review.overallScore,
                )}`}
              >
                <span className="text-5xl font-black tracking-tight">{review.overallScore}</span>
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  de 100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {isApprovedGringoLevel && (
                <div className="mb-2">
                  <Badge variant="success" className="text-xs font-bold py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    🎉 Perfil Nível Gringo Aprovado
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
            {isApprovedGringoLevel ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  <strong>Excelente base:</strong> Seu perfil cumpre os padrões dos EUA! Nas próximas etapas vamos fazer apenas ajustes finos de impacto e palavras-chave.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Oportunidade:</strong> Na etapa seguinte, vamos extrair métricas e arquitetura para elevar sua nota para mais de 90/100.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Criteria Breakdown & Executive Summary */}
        <Card className="md:col-span-7 p-6 space-y-5 bg-slate-900/80 border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Critérios de Avaliação Técnica
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Como seu perfil atual performa contra o algoritmo e os recrutadores americanos.
            </p>
          </div>

          {/* Criteria bars */}
          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{c.label}</span>
                  <span className="text-slate-400 font-semibold">{c.value}%</span>
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
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Diagnóstico dos Gargalos Principais
            </h4>
            <FormattedText
              text={review.executiveSummary}
              as="p"
              className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80"
            />
          </div>

          {/* Direction Rationale */}
          {review.profileDirection && (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm">
              <span className="font-bold text-emerald-400">Posicionamento Recomendado: </span>
              <span className="text-slate-200">{review.profileDirection.positioning}</span>
              <FormattedText
                text={review.profileDirection.rationale}
                as="p"
                className="text-slate-400 mt-1"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Section by Section Critique */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Detalhamento por Seção do Perfil</span>
          <Badge variant="outline" className="text-xs font-normal text-slate-400">
            {review.critique.length} seções analisadas
          </Badge>
        </h3>

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
                      className="text-xs uppercase font-mono font-semibold text-emerald-400 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
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
                      className="text-xs uppercase font-mono font-semibold"
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
        <div>
          <h4 className="font-bold text-white text-sm sm:text-base">
            {isApprovedGringoLevel ? 'Seu perfil já está no patamar gringo!' : 'Pronto para virar o jogo?'}
          </h4>
          <p className="text-xs text-slate-400">
            {isApprovedGringoLevel
              ? 'Deseja lapidar o posicionamento de palavras-chave e alinhar sua headline para conversão máxima?'
              : 'Defina seu cargo-alvo e inicie a entrevista rápida de coaching para transformar esses gargalos em diferenciais.'}
          </p>
        </div>

        <Button
          variant="default"
          size="lg"
          onClick={onProceedToObjective}
          className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-emerald-950/50 flex-shrink-0"
        >
          <span>{isApprovedGringoLevel ? 'Lapidar Detalhes & Avançar' : 'Definir Objetivo & Avançar'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
