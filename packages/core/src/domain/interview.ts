import { z } from 'zod';

export const interviewCategorySchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower.includes('tech') || lower.includes('arch') || lower.includes('deep')) return 'technical-depth';
    if (lower.includes('scale') || lower.includes('volume') || lower.includes('concurr')) return 'scale';
    if (lower.includes('impact') || lower.includes('result') || lower.includes('metric')) return 'impact';
    if (lower.includes('lead') || lower.includes('mentor')) return 'leadership';
    if (lower.includes('responsib') || lower.includes('invisib')) return 'responsibility';
    if (lower.includes('pref') || lower.includes('stack')) return 'preference';
    if (lower.includes('diff') || lower.includes('unique')) return 'differentiation';
    if (lower.includes('credib') || lower.includes('evid')) return 'credibility';
    if (lower.includes('market') || lower.includes('align')) return 'market';
    if (lower.includes('direct') || lower.includes('goal')) return 'direction';
    return lower;
  }
  return val;
}, z.enum([
  'direction',
  'responsibility',
  'technical-depth',
  'impact',
  'scale',
  'leadership',
  'preference',
  'market',
  'credibility',
  'differentiation',
]).catch('technical-depth'));
export type InterviewCategory = z.infer<typeof interviewCategorySchema>;

export const careerObjectiveSchema = z.object({
  targetMarket: z.string().default('United States'),
  primaryRole: z.string().min(1),
  seniority: z.string().optional(),
  workPreference: z.enum(['remote', 'hybrid', 'onsite', 'flexible']).default('remote'),
  excludedTechnologies: z.array(z.string()).default([]),
});
export type CareerObjective = z.infer<typeof careerObjectiveSchema>;

export const interviewAnswerTypeSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'text') return 'long-text';
    if (lower.includes('choice') || lower.includes('select')) return 'single-choice';
    if (lower.includes('yes') || lower.includes('bool')) return 'yes-no';
    if (lower.includes('short')) return 'short-text';
    if (lower.includes('long')) return 'long-text';
  }
  return val;
}, z.enum(['short-text', 'long-text', 'single-choice', 'yes-no']).catch('long-text'));

export const interviewQuestionSchema = z.object({
  id: z.string().min(1),
  category: interviewCategorySchema,
  question: z.string().min(1),
  reason: z.string().min(1),
  placeholderExample: z.string().optional(),
  relatedExperience: z.string().optional(),
  answerType: interviewAnswerTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

export const interviewAnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.string().default(''),
  skipped: z.boolean().default(false),
});
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;

export const confirmedFactSourceSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (
      lower.includes('link') ||
      lower.includes('pdf') ||
      lower.includes('resume') ||
      lower.includes('cv') ||
      lower.includes('profile')
    ) {
      return 'linkedin-profile';
    }
    return 'interview';
  }
  return val;
}, z.enum(['linkedin-profile', 'interview']).catch('interview'));

export const confirmedFactSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  source: confirmedFactSourceSchema,
  sourceReference: z.string().default('Experiência'),
  confirmed: z.boolean().default(false),
});
export type ConfirmedFact = z.infer<typeof confirmedFactSchema>;

export const interviewPlanSchema = z.object({
  questions: z.array(interviewQuestionSchema).default([]),
});
export type InterviewPlan = z.infer<typeof interviewPlanSchema>;

export const interviewProgressSchema = z.object({
  readyForGeneration: z.boolean(),
  rationale: z.string().min(1),
  questions: z.array(interviewQuestionSchema).default([]),
  facts: z.array(confirmedFactSchema).default([]),
});
export type InterviewProgress = z.infer<typeof interviewProgressSchema>;
