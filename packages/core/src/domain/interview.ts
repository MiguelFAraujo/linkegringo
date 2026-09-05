import { z } from 'zod';

export const interviewCategorySchema = z.enum([
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
]);
export type InterviewCategory = z.infer<typeof interviewCategorySchema>;

export const careerObjectiveSchema = z.object({
  targetMarket: z.string().default('United States'),
  primaryRole: z.string().min(1),
  seniority: z.string().optional(),
  workPreference: z.enum(['remote', 'hybrid', 'onsite', 'flexible']).default('remote'),
  excludedTechnologies: z.array(z.string()).default([]),
});
export type CareerObjective = z.infer<typeof careerObjectiveSchema>;

export const interviewQuestionSchema = z.object({
  id: z.string().min(1),
  category: interviewCategorySchema,
  question: z.string().min(1),
  reason: z.string().min(1),
  relatedExperience: z.string().optional(),
  answerType: z.enum(['short-text', 'long-text', 'single-choice', 'yes-no']),
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

export const confirmedFactSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  source: z.enum(['linkedin-profile', 'interview']),
  sourceReference: z.string().min(1),
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
