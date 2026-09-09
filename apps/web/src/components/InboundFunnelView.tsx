import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Search,
  Eye,
  FileCheck2,
  Mail,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { ProfileReview } from '@linkegringo/core';
import { FormattedText } from './ui/formatted-text';

export interface InboundFunnelViewProps {
  review: ProfileReview;
  targetRole?: string;
  onProceed?: () => void;
}

export function InboundFunnelView({
  review,
  targetRole,
  onProceed,
}: InboundFunnelViewProps) {
  const isApproved = review.overallScore >= 90;
  const targetJob = targetRole || review.profileDirection?.primaryRole || 'Senior Software Engineer';

  // 4-stage funnel scores
  const searchScore = review.scores?.searchRelevance ?? Math.min(100, Math.round(review.overallScore * 0.95));
  const cardScore = review.scores?.positioningClarity ?? Math.min(100, Math.round(review.overallScore * 0.9));
  const profileScore = Math.round(
    ((review.scores?.credibility ?? review.overallScore) + (review.scores?.evidenceCoverage ?? review.overallScore)) / 2,
  );

  // InMail conversion estimation
  const getInmailTier = (score: number) => {
    if (score >= 90) return { label: '7–12 InMails/mês', status: 'Excelente conversão', color: 'text-emerald-400' };
    if (score >= 75) return { label: '3–6 InMails/mês', status: 'Conversão moderada', color: 'text-blue-400' };
    if (score >= 55) return { label: '1–2 InMails/mês', status: 'Gargalo no card/perfil', color: 'text-amber-400' };
    return { label: '<1 InMail/mês', status: 'Funil bloqueado', color: 'text-rose-400' };
  };

  const inmailTier = getInmailTier(review.overallScore);

  const funnelStages = [
    {
      id: 'search',
      name: '1. Busca & Indexação',
      metric: `${searchScore}/100`,
      score: searchScore,
      icon: Search,
      subtitle: 'Filtros booleanos no LinkedIn Recruiter',
      detail: 'Indexação exata do cargo-alvo e palavras-chave na primeira tela de resultados.',
      healthy: searchScore >= 75,
    },
    {
      id: 'card',
      name: '2. Card do Recrutador',
      metric: `${cardScore}/100`,
      score: cardScore,
      icon: Eye,
      subtitle: 'Taxa de clique no snippet (CTR)',
      detail: 'Título sem corte nos primeiros 60 caracteres e senioridade evidente.',
      healthy: cardScore >= 75,
    },
    {
      id: 'profile',
      name: '3. Dossiê do Perfil',
      metric: `${profileScore}/100`,
      score: profileScore,
      icon: FileCheck2,
      subtitle: 'Escaneamento de 6 segundos',
      detail: 'Métricas de impacto e escopo técnico comprovado sem bullet points passivos.',
      healthy: profileScore >= 75,
    },
    {
      id: 'inmail',
      name: '4. Conversão em InMail',
      metric: inmailTier.label,
      score: review.overallScore,
      icon: Mail,
      subtitle: 'Convites para triagem técnica',
      detail: inmailTier.status,
      healthy: review.overallScore >= 75,
    },
  ];

  // 5 Strategic Inbound Optimization Opportunities
  const opportunities = [
    {
      title: 'Cargo semântico padronizado para os EUA',
      detail: `Posicionar como "${targetJob}" para corresponder ao filtro "Current Job Title" dos recrutadores gringos.`,
      critical: false,
    },
    {
      title: 'Stack de alta busca nos primeiros 60 caracteres',
      detail: 'Expor tecnologias nucleares na Headline antes do corte visual no snippet da busca do LinkedIn.',
      critical: false,
    },
    {
      title: 'Ativação de 5 títulos estratégicos no Open to Work invisível',
      detail: 'Ampliar a indexação no filtro "Open to Work: Spotlight" mantendo a visibilidade restrita a recrutadores.',
      critical: false,
    },
    {
      title: 'Bullets de experiência no framework XYZ',
      detail: 'Transformar descrições passivas em realizações com mecanismo técnico e escopo verificado.',
      critical: false,
    },
    {
      title: 'Perfil secundário em inglês americano nativo',
      detail: 'Indexação nativa no algoritmo de busca dos EUA eliminando termos traduzidos ao pé da letra.',
      critical: false,
    },
  ];

  return (
    <Card className="border-[#1E293B] bg-gradient-to-b from-[#0F1623] to-[#090D14] shadow-2xl p-5 sm:p-6 rounded-2xl">
      <CardContent className="p-0 space-y-6">
        {/* Header with Inbound Readiness Score */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Funil de Recrutamento Inbound (EUA)
              </h2>
              <Badge
                variant={isApproved ? 'success' : 'outline'}
                className={`text-[11px] font-medium py-0.5 px-2 ${
                  isApproved
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                }`}
              >
                {isApproved ? 'Inbound Ativo' : 'Otimização Necessária'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Diagnóstico de visibilidade e conversão desde a busca no LinkedIn Recruiter até o envio de InMail.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#090D14]/80 px-3.5 py-2 rounded-xl border border-[#1E293B] self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-xs text-slate-400 font-medium">Inbound Readiness:</span>
            <span className="text-sm font-bold font-mono text-white">{review.overallScore}%</span>
          </div>
        </div>

        {/* 4-Step Funnel Pipeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Pipeline do Recrutador</span>
            <span className="text-[11px] text-slate-500">Fluxo linear de atração</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {funnelStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    stage.healthy
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-amber-500/30 bg-amber-950/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          stage.healthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold text-white">{stage.metric}</span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">{stage.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{stage.subtitle}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1E293B]/60 text-[11px] text-slate-300">
                    <FormattedText text={stage.detail} as="p" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Optimization Opportunities */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Principais Oportunidades do Funil (Top 5)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {opportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[#1E293B] bg-[#090D14]/60 flex items-start gap-2.5 text-xs text-slate-300"
              >
                {opp.critical ? (
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-100 block">{opp.title}</span>
                  <FormattedText text={opp.detail} as="p" className="text-slate-400 leading-relaxed text-[11px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        {onProceed && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1E293B]">
            <span className="text-xs text-slate-400">
              Otimize esses 4 gargalos na entrevista técnica guiada para converter buscas em entrevistas.
            </span>
            <Button
              type="button"
              variant="default"
              onClick={onProceed}
              className="w-full sm:w-auto font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white gap-2 cursor-pointer shadow-md"
            >
              <span>{isApproved ? 'Avançar com Perfil Aprovado' : 'Destravar Funil de Recrutamento'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
