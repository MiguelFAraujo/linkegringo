import { describe, expect, it } from 'vitest';
import { Type } from '@google/genai';
import {
  parseAndDiagnoseSchema,
  interviewPlanSchema,
  interviewProgressSchema,
  rewrittenProfileSchema,
  profileAnalysisSchema,
} from './schemas.js';
import {
  formatCurrentDate,
  buildParseAndDiagnosePrompt,
  buildInterviewPrompt,
  buildInterviewProgressPrompt,
  buildRewriteProfilePrompt,
  PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
} from './prompts.js';
import { MOCK_PROFILE, MOCK_REVIEW } from './providers/mock.js';

describe('GenAI Structured Output Schemas', () => {
  it('defines parseAndDiagnoseSchema with integer scores and required properties', () => {
    expect(parseAndDiagnoseSchema.type).toBe(Type.OBJECT);
    expect(parseAndDiagnoseSchema.required).toEqual(['profile', 'review']);

    const profile = parseAndDiagnoseSchema.properties?.profile;
    expect(profile?.type).toBe(Type.OBJECT);
    expect(profile?.properties?.headline?.type).toBe(Type.STRING);
    expect(profile?.properties?.experiences?.type).toBe(Type.ARRAY);

    const review = parseAndDiagnoseSchema.properties?.review;
    expect(review?.type).toBe(Type.OBJECT);
    expect(review?.properties?.overallScore?.type).toBe(Type.INTEGER);
    expect(review?.properties?.scores?.type).toBe(Type.OBJECT);
    expect(review?.properties?.scores?.properties?.credibility?.type).toBe(Type.INTEGER);
  });

  it('defines interviewPlanSchema with question fields and answerType enums', () => {
    expect(interviewPlanSchema.type).toBe(Type.OBJECT);
    expect(interviewPlanSchema.required).toContain('questions');

    const questionsArray = interviewPlanSchema.properties?.questions;
    expect(questionsArray?.type).toBe(Type.ARRAY);

    const questionItem = questionsArray?.items;
    expect(questionItem?.type).toBe(Type.OBJECT);
    expect(questionItem?.required).toEqual(['id', 'category', 'question', 'reason', 'answerType']);
    expect(questionItem?.properties?.id?.type).toBe(Type.STRING);
    expect(questionItem?.properties?.category?.enum).toContain('technical-depth');
    expect(questionItem?.properties?.answerType?.enum).toEqual([
      'short-text',
      'long-text',
      'single-choice',
      'yes-no',
    ]);
  });

  it('defines interviewProgressSchema with boolean readyForGeneration and facts array', () => {
    expect(interviewProgressSchema.type).toBe(Type.OBJECT);
    expect(interviewProgressSchema.required).toEqual([
      'readyForGeneration',
      'rationale',
      'questions',
      'facts',
    ]);
    expect(interviewProgressSchema.properties?.readyForGeneration?.type).toBe(Type.BOOLEAN);

    const factsItem = interviewProgressSchema.properties?.facts?.items;
    expect(factsItem?.type).toBe(Type.OBJECT);
    expect(factsItem?.required).toEqual(['id', 'statement', 'source', 'sourceReference', 'confirmed']);
    expect(factsItem?.properties?.confirmed?.type).toBe(Type.BOOLEAN);
    expect(factsItem?.properties?.source?.enum).toEqual(['linkedin-profile', 'interview']);
  });

  it('defines rewrittenProfileSchema matching ProfileAnalysis structure', () => {
    expect(rewrittenProfileSchema.type).toBe(Type.OBJECT);
    expect(profileAnalysisSchema).toBe(rewrittenProfileSchema);
    expect(rewrittenProfileSchema.required).toContain('overallScore');
    expect(rewrittenProfileSchema.required).toContain('rewritten');

    const rewritten = rewrittenProfileSchema.properties?.rewritten;
    expect(rewritten?.type).toBe(Type.OBJECT);
    expect(rewritten?.properties?.headline?.type).toBe(Type.STRING);
    expect(rewritten?.properties?.summary?.type).toBe(Type.STRING);
    expect(rewritten?.properties?.experiences?.type).toBe(Type.ARRAY);
    expect(rewritten?.properties?.skills?.type).toBe(Type.ARRAY);
  });
});

describe('Prompts Temporal Anchor, Education Future Dates & PDF Extraction Warning', () => {
  it('formats current real-world date', () => {
    const formatted = formatCurrentDate();
    expect(formatted).toMatch(/^[A-Z][a-z]+ \d{4}$/);
  });

  it('buildParseAndDiagnosePrompt injects temporal date anchor, education future date rules, and PDF artifact warning', () => {
    const prompt = buildParseAndDiagnosePrompt('Raw text sample', 'September 2026');
    expect(prompt).toContain('Current Real-World Date: September 2026');
    expect(prompt).toContain('In the Education section, future dates (e.g. 2026-2028) indicate EXPECTED graduation');
    expect(prompt).toContain('CONTEXT ON THE DATA SOURCE & LINKEDIN FORMATTING');
    expect(prompt).toContain('The candidate\'s live profile on LinkedIn is already properly formatted');
    expect(prompt).toContain('NEVER critique, penalize, or comment on paragraphs, line breaks, or spacing');
  });

  it('PARSE_AND_DIAGNOSE_SYSTEM_PROMPT includes elite rigorous calibration, context on data source, and education date rules', () => {
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('RIGOROUS CALIBRATION FOR ELITE LEVEL (95+ SCORE)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('TEMPORAL REFERENCE & EDUCATION DATES');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('CONTEXT ON THE DATA SOURCE & LINKEDIN FORMATTING');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('take it as a given fact that the candidate\'s visual formatting');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('RECOGNITION OF ALREADY OPTIMIZED PROFILES (90 to 94 points - APPROVED FOR US TRIAGE)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Award an overallScore between 90 and 94');
  });

  it('buildInterviewPrompt, buildInterviewProgressPrompt, and buildRewriteProfilePrompt inject date anchor', () => {
    const objective = {
      targetMarket: 'United States',
      primaryRole: 'Senior Backend Engineer',
      seniority: 'senior',
      workPreference: 'remote' as const,
      excludedTechnologies: [],
    };

    const interviewPrompt = buildInterviewPrompt(MOCK_PROFILE, objective, 'September 2026');
    expect(interviewPrompt).toContain('Current Real-World Date: September 2026');

    const progressPrompt = buildInterviewProgressPrompt(
      MOCK_PROFILE,
      objective,
      { questions: [] },
      [],
      [],
      1,
      'September 2026',
    );
    expect(progressPrompt).toContain('Current Real-World Date: September 2026');

    const rewritePrompt = buildRewriteProfilePrompt(
      MOCK_PROFILE,
      objective,
      [],
      MOCK_REVIEW,
      'September 2026',
    );
    expect(rewritePrompt).toContain('Current Real-World Date: September 2026');
    expect(rewritePrompt).toContain('In the Education section, future dates indicate expected graduation');
  });
});
