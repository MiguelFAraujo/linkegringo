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
  rewritten: rewrittenProfileSchema,
});
export type ProfileAnalysis = z.infer<typeof profileAnalysisSchema>;
