import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  MapPin,
  Search,
  Check,
} from 'lucide-react';
import type { Profile } from '@linkegringo/core';
import { deriveCardConversionBadges, deriveOriginalHeadlineCritique } from '@linkegringo/core';
import { CandidateAvatar } from './ui/candidate-avatar';
import { FormattedText } from './ui/formatted-text';

export interface RecruiterSearchCardProps {
  originalProfile: Profile;
  rewrittenHeadline: string;
  primaryRole?: string;
  badges?: string[];
  reasons?: string[];
}

interface RecruiterSnippetProps {
  candidateFullName: string;
  publicId?: string;
  headline: string;
  targetRole: string;
  location?: string;
  isOpenToWork?: boolean;
  isRecruiterReady?: boolean;
  badges?: string[];
  avatarRingClass?: string;
}

function RecruiterSnippetItem({
  candidateFullName,
  publicId,
  headline,
  targetRole,
  location,
  isOpenToWork = false,
  isRecruiterReady = false,
  badges,
  avatarRingClass,
}: RecruiterSnippetProps) {
  return (
    <div
      className={`p-4 rounded-xl border bg-[#090D14]/90 space-y-3 ${
        isRecruiterReady ? 'border-emerald-500/30 shadow-inner' : 'border-[#1E293B]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <CandidateAvatar
          publicId={publicId}
          name={candidateFullName}
          size="md"
          className={avatarRingClass || (isRecruiterReady ? 'ring-2 ring-emerald-500/40' : 'ring-1 ring-rose-500/30')}
          decorative={true}
        />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100 truncate">{candidateFullName}</h4>
            {isOpenToWork && (
              <Badge
                variant="success"
                className="text-[9px] py-0 px-1.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 uppercase font-mono"
              >
                Open to Work
              </Badge>
            )}
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isRecruiterReady ? 'text-slate-100 font-medium' : 'text-slate-400 line-clamp-2 italic'
            }`}
          >
            {headline}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Briefcase className="w-3 h-3 text-blue-400" />
              {targetRole}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {location || 'Remote (Worldwide / United States)'}
            </span>
          </div>
        </div>
      </div>

      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1E293B]">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            >
              <Check className="w-2.5 h-2.5 text-emerald-400" />
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecruiterSearchCard({
  originalProfile,
  rewrittenHeadline,
  primaryRole,
  badges,
  reasons,
}: RecruiterSearchCardProps) {
  const candidateFullName =
    `${originalProfile.firstName || ''} ${originalProfile.lastName || ''}`.trim() || 'Candidato';

  const defaultBadgesAndReasons = deriveCardConversionBadges(originalProfile, rewrittenHeadline);
  const activeBadges = (badges && badges.length > 0 ? badges : defaultBadgesAndReasons.badges).slice(0, 3);
  const activeReasons = reasons && reasons.length > 0 ? reasons : defaultBadgesAndReasons.reasons;

  const targetRole = primaryRole || 'Senior Software Engineer';
  const latestExp = originalProfile.experiences?.[0];
  const originalHeadline = originalProfile.headline || '(Sem headline cadastrada)';
  const originalCritique = deriveOriginalHeadlineCritique(
    originalProfile.headline,
    rewrittenHeadline,
    latestExp,
  );
  const isAlreadyOptimized = originalCritique.isAlreadyOptimized;

  return (
    <Card className="border-[#1E293B] bg-[#0F1623]/80 shadow-2xl p-5 sm:p-7 rounded-2xl space-y-6">
      <CardContent className="p-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isAlreadyOptimized
                  ? 'Card de Busca no LinkedIn Recruiter (Recruiter-Ready)'
                  : 'Card de Busca no LinkedIn Recruiter (Antes vs Depois)'}
              </h2>
              <Badge
                variant="success"
                className="text-[11px] font-medium py-0.5 px-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              >
                Inbound Snippet
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {isAlreadyOptimized
                ? 'Visualização de como seu perfil aparece nos resultados da busca dos tech recruiters dos EUA.'
                : 'Visualização de como seu perfil aparece nos resultados da busca dos tech recruiters antes e depois da otimização.'}
            </p>
          </div>
        </div>

        {/* Unified Spotlight View when already Recruiter-Ready */}
        {isAlreadyOptimized ? (
          <div className="p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seu Perfil no LinkedIn Recruiter (Recruiter-Ready)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recruiter-Ready
              </span>
            </div>

            <RecruiterSnippetItem
              candidateFullName={candidateFullName}
              publicId={originalProfile.publicId}
              headline={originalHeadline}
              targetRole={targetRole}
              location={originalProfile.location}
              isOpenToWork={true}
              isRecruiterReady={true}
              badges={activeBadges}
            />

            {/* Why this snippet works */}
            <div className="pt-4 border-t border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Por que este snippet funciona:</span>
              </div>
              <p className="text-xs text-slate-400">
                Por que este snippet favorece uma abordagem do recruiter:
              </p>
              <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed pt-1">
                {activeReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <FormattedText text={reason} as="span" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* Side-by-Side Comparison when unoptimized: Desktop 12 cols (Before 4 cols ~30% vs After 8 cols ~70%) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* ANTES (Original) */}
            <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 opacity-80 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Antes (LinkedIn Original)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-rose-500/20 text-rose-300 border-rose-500/30">
                    {originalCritique.statusBadge}
                  </span>
                </div>

                <RecruiterSnippetItem
                  candidateFullName={candidateFullName}
                  publicId={originalProfile.publicId}
                  headline={originalHeadline}
                  targetRole={latestExp ? `${latestExp.title} • ${latestExp.companyName}` : targetRole}
                  location={originalProfile.location}
                  isOpenToWork={false}
                  isRecruiterReady={false}
                />
              </div>

              {/* Diagnostic feedback */}
              <div className="pt-3 border-t border-rose-500/20 space-y-1.5 text-xs text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider block text-rose-300">
                  Por que o recrutador ignora:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {originalCritique.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-rose-400">✕</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* DEPOIS (Otimizado) */}
            <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Depois (LinkedIn Recruiter Ready)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recruiter-Ready
                  </span>
                </div>

                <RecruiterSnippetItem
                  candidateFullName={candidateFullName}
                  publicId={originalProfile.publicId}
                  headline={rewrittenHeadline}
                  targetRole={targetRole}
                  location="Remote (Worldwide / United States)"
                  isOpenToWork={true}
                  isRecruiterReady={true}
                  badges={activeBadges}
                />
              </div>

              {/* Why this snippet works */}
              <div className="pt-3 border-t border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Por que este snippet funciona:</span>
                </div>
                <p className="text-xs text-slate-400">
                  Por que este snippet favorece uma abordagem do recruiter:
                </p>
                <ul className="space-y-1 text-[11px] text-slate-300 leading-relaxed">
                  {activeReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <FormattedText text={reason} as="span" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
