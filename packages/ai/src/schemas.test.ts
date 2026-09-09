import { describe, expect, it } from 'vitest';
import { Type } from '@google/genai';
import {
  geminiParseProfileSchema,
  geminiDiagnoseProfileSchema,
  geminiInterviewPlanSchema,
  geminiInterviewProgressSchema,
  geminiRewrittenProfileSchema,
  parseProfileSchema,
  diagnoseProfileSchema,
  interviewPlanSchema,
  interviewProgressSchema,
  rewrittenProfileSchema,
  profileAnalysisSchema,
  parseAndDiagnoseSchema,
  geminiParseAndDiagnoseSchema,
  parseAndDiagnoseReasoningSchema,
  profileReviewResponseSchema,
  profileAnalysisContentSchema,
} from './schemas.js';
import {
  formatCurrentDate,
  buildParseProfilePrompt,
  buildDiagnoseProfilePrompt,
  buildParseAndDiagnosePrompt,
  buildInterviewPrompt,
  buildInterviewProgressPrompt,
  buildRewriteProfilePrompt,
  PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
  PARSE_PROFILE_SYSTEM_PROMPT,
  DIAGNOSE_PROFILE_SYSTEM_PROMPT,
} from './prompts.js';
import { MOCK_PROFILE, MOCK_REVIEW } from './providers/mock.js';
import { ensureFormattedSummary } from './providers/gemini.js';

describe('GenAI Structured Output Schemas with CoT Deliberation Scratchpad', () => {
  it('defines geminiParseProfileSchema with reasoning deliberation scratchpad and profile', () => {
    expect(geminiParseProfileSchema.type).toBe(Type.OBJECT);
    expect(geminiParseProfileSchema.required).toEqual(['reasoning', 'profile']);
    expect(parseProfileSchema).toBe(geminiParseProfileSchema);

    const reasoning = geminiParseProfileSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual([
      'detectedLanguage',
      'sectionBoundaries',
      'chronologyAndCompanyAudit',
      'textArtifactCleanupsApplied',
    ]);
    expect(reasoning?.properties?.detectedLanguage?.enum).toEqual(['pt', 'en', 'es']);
    expect(reasoning?.properties?.sectionBoundaries?.required).toEqual([
      'header',
      'about',
      'experience',
      'education',
      'skills',
    ]);
    expect(reasoning?.properties?.chronologyAndCompanyAudit?.type).toBe(Type.ARRAY);
    expect(reasoning?.properties?.textArtifactCleanupsApplied?.type).toBe(Type.ARRAY);

    const profile = geminiParseProfileSchema.properties?.profile;
    expect(profile?.type).toBe(Type.OBJECT);
    expect(profile?.properties?.headline?.type).toBe(Type.STRING);
    expect(profile?.properties?.experiences?.type).toBe(Type.ARRAY);
  });

  it('defines geminiDiagnoseProfileSchema with evidence inventory, deductions, calculated scores, and review', () => {
    expect(geminiDiagnoseProfileSchema.type).toBe(Type.OBJECT);
    expect(geminiDiagnoseProfileSchema.required).toEqual(['reasoning', 'review']);
    expect(diagnoseProfileSchema).toBe(geminiDiagnoseProfileSchema);

    const reasoning = geminiDiagnoseProfileSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual([
      'evidenceInventory',
      'rubricAuditAndDeductions',
      'calculatedScores',
    ]);
    expect(reasoning?.properties?.evidenceInventory?.required).toEqual([
      'detectedLanguage',
      'headlineAnalysis',
      'quantifiableMetricsCount',
      'qualitativeClaims',
      'recentStintsUnderOneYear',
      'pdfSkillsLimitationNoticed',
    ]);

    const deductionsItem = reasoning?.properties?.rubricAuditAndDeductions?.items;
    expect(deductionsItem?.type).toBe(Type.OBJECT);
    expect(deductionsItem?.required).toEqual(['pillar', 'startingScore', 'deductions', 'rationale']);

    const calculatedScores = reasoning?.properties?.calculatedScores;
    expect(calculatedScores?.required).toEqual([
      'searchRelevance',
      'humanVoice',
      'credibility',
      'positioningClarity',
      'evidenceCoverage',
      'overallScore',
    ]);

    const review = geminiDiagnoseProfileSchema.properties?.review;
    expect(review?.type).toBe(Type.OBJECT);
    expect(review?.properties?.overallScore?.type).toBe(Type.INTEGER);
    expect(review?.properties?.scores?.type).toBe(Type.OBJECT);
    expect(review?.properties?.scores?.properties?.credibility?.type).toBe(Type.INTEGER);
  });

  it('defines geminiInterviewPlanSchema with question strategy, gaps, and placeholderExample', () => {
    expect(geminiInterviewPlanSchema.type).toBe(Type.OBJECT);
    expect(geminiInterviewPlanSchema.required).toEqual(['reasoning', 'questions']);
    expect(interviewPlanSchema).toBe(geminiInterviewPlanSchema);

    const reasoning = geminiInterviewPlanSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual(['diagnosticGapsIdentified', 'questionStrategy']);

    const strategyItem = reasoning?.properties?.questionStrategy?.items;
    expect(strategyItem?.required).toEqual([
      'targetTopic',
      'usRecruiterRationale',
      'memoryTrigger',
      'draftedPlaceholder',
    ]);

    const questionsArray = geminiInterviewPlanSchema.properties?.questions;
    expect(questionsArray?.type).toBe(Type.ARRAY);

    const questionItem = questionsArray?.items;
    expect(questionItem?.type).toBe(Type.OBJECT);
    expect(questionItem?.required).toEqual(['id', 'category', 'question', 'reason', 'answerType']);
    expect(questionItem?.properties?.placeholderExample?.type).toBe(Type.STRING);
    expect(questionItem?.properties?.id?.type).toBe(Type.STRING);
    expect(questionItem?.properties?.category?.enum).toContain('technical-depth');
    expect(questionItem?.properties?.answerType?.enum).toEqual([
      'short-text',
      'long-text',
      'single-choice',
      'yes-no',
    ]);
  });

  it('defines geminiInterviewProgressSchema with answer substance audit and progress payload', () => {
    expect(geminiInterviewProgressSchema.type).toBe(Type.OBJECT);
    expect(geminiInterviewProgressSchema.required).toEqual(['reasoning', 'progress']);
    expect(interviewProgressSchema).toBe(geminiInterviewProgressSchema);

    const reasoning = geminiInterviewProgressSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual([
      'answerSubstanceAudit',
      'generationReadinessDeliberation',
      'factsExtractionPlan',
    ]);

    const progress = geminiInterviewProgressSchema.properties?.progress;
    expect(progress?.type).toBe(Type.OBJECT);
    expect(progress?.required).toEqual([
      'readyForGeneration',
      'rationale',
      'questions',
      'facts',
    ]);
    expect(progress?.properties?.readyForGeneration?.type).toBe(Type.BOOLEAN);

    const factsItem = progress?.properties?.facts?.items;
    expect(factsItem?.type).toBe(Type.OBJECT);
    expect(factsItem?.required).toEqual(['id', 'statement', 'source', 'sourceReference', 'confirmed']);
    expect(factsItem?.properties?.confirmed?.type).toBe(Type.BOOLEAN);
    expect(factsItem?.properties?.source?.enum).toEqual(['linkedin-profile', 'interview']);
  });

  it('defines geminiRewrittenProfileSchema with positioning archetype, blueprints, fact mapping, and analysis', () => {
    expect(geminiRewrittenProfileSchema.type).toBe(Type.OBJECT);
    expect(geminiRewrittenProfileSchema.required).toEqual(['reasoning', 'analysis']);
    expect(rewrittenProfileSchema).toBe(geminiRewrittenProfileSchema);
    expect(profileAnalysisSchema).toBe(geminiRewrittenProfileSchema);

    const reasoning = geminiRewrittenProfileSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual([
      'positioningArchetype',
      'headlineFormulation',
      'aboutSectionBlueprint',
      'experienceFactMapping',
      'scoreImprovementAudit',
    ]);

    const blueprint = reasoning?.properties?.aboutSectionBlueprint;
    expect(blueprint?.required).toEqual(['hookSentence', 'architectureParagraph', 'categorizedStack']);

    const factMappingItem = reasoning?.properties?.experienceFactMapping?.items;
    expect(factMappingItem?.required).toEqual(['company', 'assignedFacts', 'xyzBulletsDraft']);

    const analysis = geminiRewrittenProfileSchema.properties?.analysis;
    expect(analysis?.type).toBe(Type.OBJECT);
    expect(analysis?.required).toContain('overallScore');
    expect(analysis?.required).toContain('rewritten');

    const rewritten = analysis?.properties?.rewritten;
    expect(rewritten?.type).toBe(Type.OBJECT);
    expect(rewritten?.properties?.headline?.type).toBe(Type.STRING);
    expect(rewritten?.properties?.summary?.type).toBe(Type.STRING);
    expect(rewritten?.properties?.experiences?.type).toBe(Type.ARRAY);
    expect(rewritten?.properties?.skills?.type).toBe(Type.ARRAY);
  });

  it('preserves backward compatibility with legacy parseAndDiagnoseSchema', () => {
    expect(parseAndDiagnoseSchema.type).toBe(Type.OBJECT);
    expect(parseAndDiagnoseSchema.required).toEqual(['profile', 'review']);
  });

  it('defines geminiParseAndDiagnoseSchema with 4-phase procedural CoT reasoning, profile, and review with triageBottlenecks', () => {
    expect(geminiParseAndDiagnoseSchema.type).toBe(Type.OBJECT);
    expect(geminiParseAndDiagnoseSchema.required).toEqual(['reasoning', 'profile', 'review']);

    const reasoning = geminiParseAndDiagnoseSchema.properties?.reasoning;
    expect(reasoning?.type).toBe(Type.OBJECT);
    expect(reasoning?.required).toEqual([
      'physicalInventory',
      'spatialSeparationAndStitching',
      'rubricAuditAndDeductions',
      'calculatedScores',
      'outputInvariantCheck',
    ]);

    // Phase 1: Physical Inventory & Count N
    const phase1 = reasoning?.properties?.physicalInventory;
    expect(phase1?.type).toBe(Type.OBJECT);
    expect(phase1?.required).toEqual(['companyCountN', 'companiesEnumerated']);
    expect(phase1?.properties?.companyCountN?.type).toBe(Type.INTEGER);
    expect(phase1?.properties?.companiesEnumerated?.type).toBe(Type.ARRAY);

    // Phase 2: Spatial Separation & Column Stitching
    const phase2 = reasoning?.properties?.spatialSeparationAndStitching;
    expect(phase2?.type).toBe(Type.OBJECT);
    expect(phase2?.required).toEqual(['sidebarElementsIdentified', 'pageBreakContinuationsStitched']);
    expect(phase2?.properties?.sidebarElementsIdentified?.type).toBe(Type.ARRAY);
    expect(phase2?.properties?.pageBreakContinuationsStitched?.type).toBe(Type.ARRAY);

    // Phase 3: Deterministic Rubric Deduction
    const phase3 = reasoning?.properties?.rubricAuditAndDeductions;
    expect(phase3?.type).toBe(Type.ARRAY);
    expect(phase3?.items?.required).toEqual(['pillar', 'startingScore', 'deductions', 'rationale']);

    // Calculated scores
    const calculatedScores = reasoning?.properties?.calculatedScores;
    expect(calculatedScores?.required).toEqual([
      'searchRelevance',
      'humanVoice',
      'credibility',
      'positioningClarity',
      'evidenceCoverage',
      'overallScore',
    ]);

    // Phase 4: Output Invariant Check
    const phase4 = reasoning?.properties?.outputInvariantCheck;
    expect(phase4?.type).toBe(Type.OBJECT);
    expect(phase4?.required).toEqual(['inventoryCountN', 'extractedExperiencesCount', 'invariantSatisfied']);
    expect(phase4?.properties?.inventoryCountN?.type).toBe(Type.INTEGER);
    expect(phase4?.properties?.extractedExperiencesCount?.type).toBe(Type.INTEGER);
    expect(phase4?.properties?.invariantSatisfied?.type).toBe(Type.BOOLEAN);

    // Review includes triageBottlenecks
    const review = geminiParseAndDiagnoseSchema.properties?.review;
    expect(review?.properties?.triageBottlenecks?.type).toBe(Type.ARRAY);
    expect(review?.required).toContain('triageBottlenecks');

    // profileReviewResponseSchema and profileAnalysisContentSchema include triageBottlenecks
    expect(profileReviewResponseSchema.properties?.triageBottlenecks?.type).toBe(Type.ARRAY);
    expect(profileReviewResponseSchema.required).toContain('triageBottlenecks');
    expect(profileAnalysisContentSchema.properties?.triageBottlenecks?.type).toBe(Type.ARRAY);
    expect(profileAnalysisContentSchema.required).toContain('triageBottlenecks');
  });
});

describe('Prompts Temporal Anchor, Education Future Dates & PDF Extraction Warning', () => {
  it('formats current real-world date', () => {
    const formatted = formatCurrentDate();
    expect(formatted).toMatch(/^[A-Z][a-z]+ \d{4}$/);
  });

  it('buildParseProfilePrompt injects date anchor, education rules, and CoT reasoning schema', () => {
    const prompt = buildParseProfilePrompt('Raw text sample', 'September 2026');
    expect(prompt).toContain('Current Real-World Date: September 2026');
    expect(prompt).toContain('In the Education section, future dates (e.g. 2026-2028) indicate EXPECTED graduation');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"sectionBoundaries"');
    expect(prompt).toContain('"chronologyAndCompanyAudit"');
  });

  it('buildDiagnoseProfilePrompt injects targetRole, date anchor, and CoT rubric structure', () => {
    const prompt = buildDiagnoseProfilePrompt(MOCK_PROFILE, 'September 2026', 'Staff Platform Engineer');
    expect(prompt).toContain('Current Real-World Date: September 2026');
    expect(prompt).toContain('Staff Platform Engineer');
    expect(prompt).toContain('rubricAuditAndDeductions');
    expect(prompt).toContain('calculatedScores');
  });

  it('buildParseAndDiagnosePrompt injects temporal date anchor, education future date rules, and PDF artifact warning', () => {
    const prompt = buildParseAndDiagnosePrompt('Raw text sample', 'September 2026');
    expect(prompt).toContain('Current Real-World Date: September 2026');
    expect(prompt).toContain('In the Education section, future dates (e.g. 2026-2028) indicate EXPECTED graduation');
    expect(prompt).toContain('CONTEXT ON THE DATA SOURCE & LINKEDIN FORMATTING');
    expect(prompt).toContain('The candidate\'s live profile on LinkedIn is already properly formatted');
    expect(prompt).toContain('NEVER critique, penalize, or comment on paragraphs, line breaks, or spacing');
  });

  it('PARSE_AND_DIAGNOSE_SYSTEM_PROMPT and DIAGNOSE_PROFILE_SYSTEM_PROMPT include elite calibration and few-shots', () => {
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('RIGOROUS CALIBRATION FOR ELITE LEVEL (95+ SCORE)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('TEMPORAL REFERENCE & EDUCATION DATES');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('CONTEXT ON THE DATA SOURCE & LINKEDIN FORMATTING');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('take it as a given fact that the candidate\'s visual formatting');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('RECOGNITION OF ALREADY OPTIMIZED PROFILES (90 to 94 points - APPROVED FOR US TRIAGE)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Award an overallScore between 90 and 94');

    expect(PARSE_PROFILE_SYSTEM_PROMPT).toContain('MANDATORY CHAIN-OF-THOUGHT (COT) DELIBERATION SCRATCHPAD');
    expect(DIAGNOSE_PROFILE_SYSTEM_PROMPT).toContain('FEW-SHOT CALIBRATION DEMONSTRATIONS');
    expect(DIAGNOSE_PROFILE_SYSTEM_PROMPT).toContain('rubricAuditAndDeductions');
  });

  it('buildInterviewPrompt, buildInterviewProgressPrompt, and buildRewriteProfilePrompt inject date anchor and CoT instructions', () => {
    const objective = {
      targetMarket: 'United States',
      primaryRole: 'Senior Backend Engineer',
      seniority: 'senior',
      workPreference: 'remote' as const,
      excludedTechnologies: [],
    };

    const interviewPrompt = buildInterviewPrompt(MOCK_PROFILE, objective, 'September 2026');
    expect(interviewPrompt).toContain('Current Real-World Date: September 2026');
    expect(interviewPrompt).toContain('diagnosticGapsIdentified');
    expect(interviewPrompt).toContain('questionStrategy');
    expect(interviewPrompt).toContain('placeholderExample');

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
    expect(progressPrompt).toContain('answerSubstanceAudit');

    const rewritePrompt = buildRewriteProfilePrompt(
      MOCK_PROFILE,
      objective,
      [],
      MOCK_REVIEW,
      'September 2026',
    );
    expect(rewritePrompt).toContain('Current Real-World Date: September 2026');
    expect(rewritePrompt).toContain('positioningArchetype');
    expect(rewritePrompt).toContain('headlineFormulation');
    expect(rewritePrompt).toContain('In the Education section, future dates indicate expected graduation');
    expect(rewritePrompt).toContain('STRICT NON-REGRESSION INVARIANT');
  });

  it('enforces non-regression when initialReview has perfect 100 scores', () => {
    const objective = {
      targetMarket: 'United States',
      primaryRole: 'Staff Backend Engineer',
      seniority: 'staff',
      workPreference: 'remote' as const,
      excludedTechnologies: [],
    };

    const perfectReview = {
      ...MOCK_REVIEW,
      overallScore: 92,
      scores: {
        searchRelevance: 100,
        humanVoice: 90,
        credibility: 100,
        positioningClarity: 100,
        evidenceCoverage: 70,
      },
    };

    const rewritePrompt = buildRewriteProfilePrompt(
      MOCK_PROFILE,
      objective,
      [],
      perfectReview,
      'September 2026',
    );

    expect(rewritePrompt).toContain('searchRelevance MUST be >= 100');
    expect(rewritePrompt).toContain('credibility MUST be >= 100');
    expect(rewritePrompt).toContain('evidenceCoverage MUST be >= 70');
    expect(rewritePrompt).toContain('overallScore MUST be >= 92 (typically 94-98)');
    expect(rewritePrompt).toContain('PROFILE REWRITE ATS RULES & HARD CONSTRAINTS');
    expect(rewritePrompt).toContain('Headline formula (max 160 characters)');
    expect(rewritePrompt).toContain('About hook (first 250 characters)');
    expect(rewritePrompt).toContain('100% Google XYZ bullets');
  });
});

describe('ensureFormattedSummary helper', () => {
  it('preserves text already formatted with double newlines', () => {
    const input = 'Paragraph 1\n\nParagraph 2\n\nTechnologies: Go, K8s';
    expect(ensureFormattedSummary(input)).toBe(input);
  });

  it('expands single newlines to double newlines for paragraph breathing', () => {
    const input = 'Paragraph 1\nParagraph 2\nTechnologies: Go, K8s';
    const expected = 'Paragraph 1\n\nParagraph 2\n\nTechnologies: Go, K8s';
    expect(ensureFormattedSummary(input)).toBe(expected);
  });

  it('inserts paragraph breaks before known section headings if text is a single continuous block', () => {
    const input = 'Senior backend engineer building distributed systems. Technologies: Go, Kafka, AWS. Key Competencies: High throughput pipelines.';
    const output = ensureFormattedSummary(input);
    expect(output).toContain('\n\nTechnologies: Go, Kafka, AWS.');
    expect(output).toContain('\n\nKey Competencies: High throughput pipelines.');
  });
});

