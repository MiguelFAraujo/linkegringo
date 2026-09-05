import { z } from 'zod';

export const critiqueSeveritySchema = z.enum(['high', 'medium', 'low']);
export type CritiqueSeverity = z.infer<typeof critiqueSeveritySchema>;

export const sectionCritiqueSchema = z.object({
  section: z.string(),
  assessment: z.string(),
  strengths: z.array(z.string()).default([]),
  issues: z.array(z.string()).default([]),
  severity: critiqueSeveritySchema,
});
export type SectionCritique = z.infer<typeof sectionCritiqueSchema>;

export const profileScoresSchema = z.object({
  searchRelevance: z.number().int().min(0).max(100),
  humanVoice: z.number().int().min(0).max(100),
  credibility: z.number().int().min(0).max(100),
  positioningClarity: z.number().int().min(0).max(100),
  evidenceCoverage: z.number().int().min(0).max(100),
});
export type ProfileScores = z.infer<typeof profileScoresSchema>;

export const profileDirectionSchema = z.object({
  positioning: z.string(),
  primaryRole: z.string(),
  alternativeRoles: z.array(z.string()).default([]),
  rationale: z.string(),
});
export type ProfileDirection = z.infer<typeof profileDirectionSchema>;

export const profileReviewSchema = z.object({
  targetMarket: z.string().default('United States'),
  language: z.string().default('en'),
  overallScore: z.number().int().min(0).max(100),
  scores: profileScoresSchema,
  executiveSummary: z.string(),
  profileDirection: profileDirectionSchema,
  critique: z.array(sectionCritiqueSchema).default([]),
});
export type ProfileReview = z.infer<typeof profileReviewSchema>;

export const rewrittenExperienceSchema = z.object({
  title: z.string(),
  companyName: z.string(),
  bullets: z.array(z.string()).default([]),
});
export type RewrittenExperience = z.infer<typeof rewrittenExperienceSchema>;

export const rewrittenProfileSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  experiences: z.array(rewrittenExperienceSchema).default([]),
  skills: z.array(z.string()).default([]),
});
export type RewrittenProfile = z.infer<typeof rewrittenProfileSchema>;

export const profileAnalysisSchema = z.object({
  targetMarket: z.string().default('United States'),
  language: z.string().default('en'),
  initialScore: z.number().int().min(0).max(100).optional(),
  overallScore: z.number().int().min(0).max(100),
  scores: profileScoresSchema,
  executiveSummary: z.string(),
  profileDirection: profileDirectionSchema,
  critique: z.array(sectionCritiqueSchema).default([]),
  rewritten: rewrittenProfileSchema,
});
export type ProfileAnalysis = z.infer<typeof profileAnalysisSchema>;
