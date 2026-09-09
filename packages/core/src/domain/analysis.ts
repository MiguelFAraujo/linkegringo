import { z } from 'zod';

export const critiqueSeveritySchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'critical' || lower === 'grave') return 'high';
    if (lower === 'moderate' || lower === 'moderado') return 'medium';
    if (lower === 'minor' || lower === 'leve') return 'low';
    return lower;
  }
  return val;
}, z.enum(['high', 'medium', 'low']).catch('medium'));
export type CritiqueSeverity = z.infer<typeof critiqueSeveritySchema>;

export const sectionCritiqueSchema = z.object({
  section: z.string(),
  assessment: z.string(),
  strengths: z.preprocess((val) => {
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.map(String);
    return [];
  }, z.array(z.string()).default([])),
  issues: z.preprocess((val) => {
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.map(String);
    return [];
  }, z.array(z.string()).default([])),
  severity: critiqueSeveritySchema,
});
export type SectionCritique = z.infer<typeof sectionCritiqueSchema>;

const scoreNumber = z.coerce
  .number()
  .transform((n) => Math.round(n))
  .pipe(z.number().min(0).max(100));

export const profileScoresSchema = z.object({
  searchRelevance: scoreNumber,
  humanVoice: scoreNumber,
  credibility: scoreNumber,
  positioningClarity: scoreNumber,
  evidenceCoverage: scoreNumber,
});
export type ProfileScores = z.infer<typeof profileScoresSchema>;

export const scoreExplanationsSchema = z.object({
  searchRelevance: z.string().default(''),
  humanVoice: z.string().default(''),
  credibility: z.string().default(''),
  positioningClarity: z.string().default(''),
  evidenceCoverage: z.string().default(''),
});
export type ScoreExplanations = z.infer<typeof scoreExplanationsSchema>;

export const profileDirectionSchema = z.object({
  positioning: z.string(),
  primaryRole: z.string(),
  alternativeRoles: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return [];
  }, z.array(z.string()).default([])),
  openToWorkTitles: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return undefined;
  }, z.array(z.string()).optional()),
  rationale: z.string(),
});
export type ProfileDirection = z.infer<typeof profileDirectionSchema>;

export const profileGapTargetSectionSchema = z.enum(['headline', 'about', 'experience', 'skills']);
export type ProfileGapTargetSection = z.infer<typeof profileGapTargetSectionSchema>;

export const profileGapSchema = z.object({
  id: z.string(),
  label: z.string(),
  targetSection: profileGapTargetSectionSchema,
  targetExperienceId: z.string().optional(),
  targetBulletIndex: z.number().optional(),
  targetBlockId: z.string().optional(),
  suggestedUnlock: z.string().optional(),
});
export type ProfileGap = z.infer<typeof profileGapSchema>;

export const profileReviewSchema = z.object({
  targetMarket: z.string().default('United States'),
  language: z.string().default('en'),
  overallScore: scoreNumber,
  scores: profileScoresSchema,
  scoreExplanations: scoreExplanationsSchema.optional(),
  executiveSummary: z.string(),
  profileDirection: profileDirectionSchema,
  critique: z.array(sectionCritiqueSchema).default([]),
  triageBottlenecks: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return [];
  }, z.array(z.string()).default([])),
  primaryGaps: z.array(profileGapSchema).optional(),
  inboundReadiness: z
    .object({
      score: scoreNumber,
      primaryGapId: z.string().optional(),
    })
    .optional(),
});
export type ProfileReview = z.infer<typeof profileReviewSchema>;

export const rewrittenExperienceSchema = z.object({
  title: z.string(),
  companyName: z.string(),
  bullets: z.preprocess((val) => {
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.map(String);
    return [];
  }, z.array(z.string()).default([])),
});
export type RewrittenExperience = z.infer<typeof rewrittenExperienceSchema>;

export const rewrittenProfileSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  experiences: z.array(rewrittenExperienceSchema).default([]),
  skills: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(/,\s*/);
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'object' && v && 'name' in v ? String((v as any).name) : String(v)));
    }
    return [];
  }, z.array(z.string()).default([])),
  openToWorkTitles: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return undefined;
  }, z.array(z.string()).optional()),
  cardConversionBadges: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return undefined;
  }, z.array(z.string()).optional()),
  cardConversionReasons: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return undefined;
  }, z.array(z.string()).optional()),
});
export type RewrittenProfile = z.infer<typeof rewrittenProfileSchema>;

export const profileAnalysisSchema = z.object({
  targetMarket: z.string().default('United States'),
  language: z.string().default('en'),
  initialScore: scoreNumber.optional(),
  overallScore: scoreNumber,
  scores: profileScoresSchema,
  scoreExplanations: scoreExplanationsSchema.optional(),
  executiveSummary: z.string(),
  profileDirection: profileDirectionSchema,
  critique: z.array(sectionCritiqueSchema).default([]),
  triageBottlenecks: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) return [val.trim()];
    return [];
  }, z.array(z.string()).default([])),
  primaryGaps: z.array(profileGapSchema).optional(),
  inboundReadiness: z
    .object({
      score: scoreNumber,
      primaryGapId: z.string().optional(),
    })
    .optional(),
  rewritten: rewrittenProfileSchema,
});
export type ProfileAnalysis = z.infer<typeof profileAnalysisSchema>;

/**
 * Calculates deterministic Inbound Readiness score (0-100) from 5 analytical pillars.
 * Formula: 0.35 * Search + 0.25 * Positioning + 0.20 * Evidence + 0.10 * Credibility + 0.10 * HumanVoice
 */
export function calculateInboundReadiness(scores: ProfileScores): number {
  const raw =
    0.35 * scores.searchRelevance +
    0.25 * scores.positioningClarity +
    0.20 * scores.evidenceCoverage +
    0.10 * scores.credibility +
    0.10 * scores.humanVoice;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export const rawInboundReadiness = calculateInboundReadiness;
export const calculateRawInboundReadiness = calculateInboundReadiness;

export const inboundStageStatusSchema = z.enum(['ready', 'needs_attention', 'blocked', 'not_measurable']);
export type InboundStageStatus = z.infer<typeof inboundStageStatusSchema>;

export const inboundStageSchema = z.object({
  id: z.enum(['search', 'card', 'profile', 'inmail']),
  name: z.string(),
  score: z.number().optional(),
  status: inboundStageStatusSchema,
  primaryGapId: z.string().optional(),
  primaryGap: profileGapSchema.optional(),
  description: z.string().optional(),
});
export type InboundStage = z.infer<typeof inboundStageSchema>;

export const inboundJourneySchema = z.object({
  search: inboundStageSchema,
  card: inboundStageSchema,
  profile: inboundStageSchema,
  inmail: inboundStageSchema,
  stages: z.array(inboundStageSchema),
});
export type InboundJourney = z.infer<typeof inboundJourneySchema>;

/**
 * Calculates independent Inbound Journey funnel stages from 5 analytical pillars.
 * - search: round(0.70 * searchRelevance + 0.30 * positioningClarity)
 * - card: round(0.65 * positioningClarity + 0.20 * searchRelevance + 0.15 * humanVoice)
 * - profile: round(0.55 * evidenceCoverage + 0.30 * credibility + 0.15 * humanVoice)
 * - inmail: { status: 'not_measurable' }
 */
export function calculateInboundJourney(
  scores: ProfileScores,
  primaryGaps?: ProfileGap[],
): InboundJourney {
  const gaps = primaryGaps ?? [];

  const searchScore = Math.min(
    100,
    Math.max(0, Math.round(0.7 * scores.searchRelevance + 0.3 * scores.positioningClarity)),
  );
  const cardScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.65 * scores.positioningClarity + 0.2 * scores.searchRelevance + 0.15 * scores.humanVoice,
      ),
    ),
  );
  const profileScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.55 * scores.evidenceCoverage + 0.3 * scores.credibility + 0.15 * scores.humanVoice,
      ),
    ),
  );

  const getStatus = (s: number): InboundStageStatus =>
    s >= 80 ? 'ready' : s >= 60 ? 'needs_attention' : 'blocked';

  // Associate primary gaps with card and profile
  const headlineGap = gaps.find((g) => g.targetSection === 'headline');
  const profileSectionGap = gaps.find((g) => g.targetSection !== 'headline');

  const cardGap = headlineGap ?? (cardScore < 80 ? gaps[0] : undefined);
  const profileGap = profileSectionGap ?? (profileScore < 80 ? gaps[1] ?? gaps[0] : undefined);

  const searchStage: InboundStage = {
    id: 'search',
    name: 'Busca',
    score: searchScore,
    status: getStatus(searchScore),
    description: 'Indexação em filtros booleanos no LinkedIn Recruiter',
  };

  const cardStage: InboundStage = {
    id: 'card',
    name: 'Card',
    score: cardScore,
    status: getStatus(cardScore),
    primaryGapId: cardGap?.id,
    primaryGap: cardGap,
    description: 'Taxa de clique (CTR) no snippet de 60 caracteres',
  };

  const profileStage: InboundStage = {
    id: 'profile',
    name: 'Perfil',
    score: profileScore,
    status: getStatus(profileScore),
    primaryGapId: profileGap?.id,
    primaryGap: profileGap,
    description: 'Triagem técnica de 6 segundos e densidade de impacto',
  };

  const inmailStage: InboundStage = {
    id: 'inmail',
    name: 'InMail',
    status: 'not_measurable',
    description: 'Conversão em mensagens diretas de tech recruiters',
  };

  return {
    search: searchStage,
    card: cardStage,
    profile: profileStage,
    inmail: inmailStage,
    stages: [searchStage, cardStage, profileStage, inmailStage],
  };
}

export function getInboundReadinessClassification(score: number): {
  label: string;
  classification: string;
  status: InboundStageStatus;
} {
  if (score >= 90) {
    return {
      label: 'Perfil Aprovado para Triagem nos EUA',
      classification: 'Good foundation. Ready for top-tier inbound screening',
      status: 'ready',
    };
  }
  if (score >= 60) {
    return {
      label: 'Perfil Competitivo com Ajustes Pontuais',
      classification: 'Good foundation. One major blocker',
      status: 'needs_attention',
    };
  }
  return {
    label: 'Gargalos Críticos na Triagem',
    classification: 'Critical blockers. Unlikely to pass US screening',
    status: 'blocked',
  };
}

