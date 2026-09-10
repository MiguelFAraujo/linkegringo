import { describe, expect, it } from 'vitest';
import type { CareerObjective, ConfirmedFact, InterviewAnswer, InterviewPlan, ProfileReview } from '@linkegringo/core';
import {
  buildParseProfilePrompt,
  buildDiagnoseProfilePrompt,
  buildParseAndDiagnosePrompt,
  buildInterviewPrompt,
  buildInterviewProgressPrompt,
  buildRewriteProfilePrompt,
  detectSparseExperiences,
  getExperienceBulletCount,
  PARSE_PROFILE_SYSTEM_PROMPT,
  DIAGNOSE_PROFILE_SYSTEM_PROMPT,
  PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
  INTERVIEW_SYSTEM_PROMPT,
  INTERVIEW_PROGRESS_SYSTEM_PROMPT,
  REWRITE_PROFILE_SYSTEM_PROMPT,
} from './prompts.js';
import { MOCK_PROFILE, MOCK_REVIEW } from './providers/mock.js';

const SAMPLE_OBJECTIVE: CareerObjective = {
  targetMarket: 'United States',
  primaryRole: 'Senior Backend Engineer',
  seniority: 'senior',
  workPreference: 'remote',
  excludedTechnologies: [],
};

describe('Zero Raw Pseudo-JSON Schemas in Prompt Texts', () => {
  const mockPlan: InterviewPlan = { questions: [] };
  const mockAnswers: InterviewAnswer[] = [];
  const mockFacts: ConfirmedFact[] = [];

  const promptsToInspect: { name: string; text: string }[] = [
    { name: 'PARSE_PROFILE_SYSTEM_PROMPT', text: PARSE_PROFILE_SYSTEM_PROMPT },
    { name: 'DIAGNOSE_PROFILE_SYSTEM_PROMPT', text: DIAGNOSE_PROFILE_SYSTEM_PROMPT },
    { name: 'PARSE_AND_DIAGNOSE_SYSTEM_PROMPT', text: PARSE_AND_DIAGNOSE_SYSTEM_PROMPT },
    { name: 'INTERVIEW_SYSTEM_PROMPT', text: INTERVIEW_SYSTEM_PROMPT },
    { name: 'INTERVIEW_PROGRESS_SYSTEM_PROMPT', text: INTERVIEW_PROGRESS_SYSTEM_PROMPT },
    { name: 'REWRITE_PROFILE_SYSTEM_PROMPT', text: REWRITE_PROFILE_SYSTEM_PROMPT },
    { name: 'buildParseProfilePrompt', text: buildParseProfilePrompt('Raw PDF Text', 'September 2026') },
    { name: 'buildDiagnoseProfilePrompt', text: buildDiagnoseProfilePrompt(MOCK_PROFILE, 'September 2026', 'Senior Backend Engineer') },
    { name: 'buildParseAndDiagnosePrompt', text: buildParseAndDiagnosePrompt('Raw PDF Text', 'September 2026', 'Senior Backend Engineer') },
    { name: 'buildInterviewPrompt', text: buildInterviewPrompt(MOCK_PROFILE, SAMPLE_OBJECTIVE, 'September 2026', MOCK_REVIEW) },
    { name: 'buildInterviewProgressPrompt', text: buildInterviewProgressPrompt(MOCK_PROFILE, SAMPLE_OBJECTIVE, mockPlan, mockAnswers, mockFacts, 1, 'September 2026') },
    { name: 'buildRewriteProfilePrompt', text: buildRewriteProfilePrompt(MOCK_PROFILE, SAMPLE_OBJECTIVE, mockFacts, MOCK_REVIEW, 'September 2026') },
  ];

  it.each(promptsToInspect)('$name does not contain pseudo-JSON schema types or placeholders', ({ text }) => {
    // Should NOT contain pseudo-JSON types or syntax placeholders
    expect(text).not.toContain('"type": "object"');
    expect(text).not.toContain('"type": "string"');
    expect(text).not.toContain('"type": "array"');
    expect(text).not.toContain('<string>');
    expect(text).not.toContain('<integer>');
    expect(text).not.toContain('<boolean>');
    expect(text).not.toContain('<integer 0-100>');
    expect(text).not.toContain('<integer between');
    expect(text).not.toContain('```json\n{\n  "profile":');
  });
});

describe('4-Phase Procedural CoT Reasoning Instructions', () => {
  it('PARSE_AND_DIAGNOSE_SYSTEM_PROMPT defines the 4-phase sequential CoT deliberation', () => {
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('MANDATORY 4-PHASE PROCEDURAL CHAIN-OF-THOUGHT (COT) REASONING');
    
    // Phase 1: Physical Inventory & Count N
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Phase 1: Physical Inventory & Count N');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('total count N');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('physical document inventory');

    // Phase 2: Spatial Separation & Column Stitching
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Phase 2: Spatial Separation & Column Stitching');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('sidebar elements');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('stitch cross-page continuation');

    // Phase 3: Deterministic Rubric Deduction
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Phase 3: Deterministic Rubric Deduction');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('start at 100 points');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('ZERO PHANTOM DEDUCTIONS');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('triageBottlenecks');

    // Phase 4: Output Invariant Check
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Phase 4: Output Invariant Check');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('profile.experiences.length == N');
  });

  it('buildParseAndDiagnosePrompt mandates all 4 phases and invariant check', () => {
    const prompt = buildParseAndDiagnosePrompt('Raw PDF Text', 'September 2026', 'Staff Platform Engineer');
    
    expect(prompt).toContain('MANDATORY 4-PHASE PROCEDURAL COT INSTRUCTIONS');
    expect(prompt).toContain('Phase 1 (Physical Inventory & Count N)');
    expect(prompt).toMatch(/(count\s+N|total\s+count|physical\s+inventory)/i);
    
    expect(prompt).toContain('Phase 2 (Spatial Separation & Column Stitching)');
    expect(prompt).toMatch(/(spatial|column|stitch|sidebar)/i);

    expect(prompt).toContain('Phase 3 (Deterministic Rubric Deduction)');
    expect(prompt).toContain('ZERO PHANTOM DEDUCTIONS');
    expect(prompt).toContain('100 pts');
    expect(prompt).toContain('triageBottlenecks');

    expect(prompt).toContain('Phase 4 (Output Invariant Check)');
    expect(prompt).toMatch(/(invariant|verify|length\s*==\s*N|profile\.experiences)/i);
  });
});

describe('Triage Bottlenecks Targeting in Interview Generation', () => {
  it('buildInterviewPrompt targets triageBottlenecks when provided in review', () => {
    const reviewWithBottlenecks: ProfileReview = {
      ...MOCK_REVIEW,
      triageBottlenecks: [
        'Perfil redigido em português inviabiliza indexação ATS.',
        'Falta de métricas Google XYZ nas experiências recentes.',
        'Stint curto de 7 meses sem contextualização.',
      ],
    };

    const prompt = buildInterviewPrompt(
      MOCK_PROFILE,
      SAMPLE_OBJECTIVE,
      'September 2026',
      reviewWithBottlenecks,
    );

    expect(prompt).toContain('PRIORITY INTERVIEW TARGETS — RECRUITER TRIAGE BOTTLENECKS:');
    expect(prompt).toContain('1. Perfil redigido em português inviabiliza indexação ATS.');
    expect(prompt).toContain('2. Falta de métricas Google XYZ nas experiências recentes.');
    expect(prompt).toContain('3. Stint curto de 7 meses sem contextualização.');
    expect(prompt).toContain('Missing XYZ metrics');
    expect(prompt).toContain('Passive or non-specialized positioning');
    expect(prompt).toContain('Short stints or employment transitions');
  });

  it('buildInterviewPrompt gracefully handles empty or missing triageBottlenecks', () => {
    const reviewWithoutBottlenecks: ProfileReview = {
      ...MOCK_REVIEW,
      triageBottlenecks: [],
      critique: [],
    };

    const prompt = buildInterviewPrompt(
      MOCK_PROFILE,
      SAMPLE_OBJECTIVE,
      'September 2026',
      reviewWithoutBottlenecks,
    );

    expect(prompt).not.toContain('PRIORITY INTERVIEW TARGETS — RECRUITER TRIAGE BOTTLENECKS:');
    expect(prompt).toContain(
      'Generate an adaptive interview plan (4 to 6 surgical questions) for this candidate targeting "Senior Backend Engineer".',
    );
  });
});

describe('US Tech Recruiter Playbook & NDA Proxy Metrics Rubric', () => {
  it('BASE_RECRUITER_INSTRUCTIONS enshrines proxy metrics under NDA, bans hallucinated numbers, and enforces strict rigor against shallow bullets', () => {
    // NDA & proxy metrics first-class citizenship
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('NDA, PROXY METRICS & STRICT TECHNICAL DEPTH');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('ZERO PHANTOM DEDUCTIONS FOR MISSING CURRENCY');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('carry 100% EQUAL WEIGHT to dollar ($) figures');

    // Prohibition of fabricated numbers
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('ZERO HALLUCINATED NUMBERS');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('NEVER invent, fabricate, or hallucinate arbitrary numbers');

    // High rigor against shallow bullets
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('HIGH RIGOR AGAINST SHALLOW OR SUPERFICIAL BULLETS (STRICT DEPTH ENFORCEMENT)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('complete engineering triad');

    // Elite tier calibration
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('RIGOROUS CALIBRATION FOR ELITE LEVEL (95+ SCORE)');
  });

  it('INTERVIEW_SYSTEM_PROMPT embeds the 6 core axes, active discovery mandate, and 4-6 question structure', () => {
    // 6 Core Axes
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('THE 6 CORE AXES OF THE US TECH RECRUITER PLAYBOOK');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('1. Scope & Ownership');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('2. Architectural Trade-offs & Engineering Judgment');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('3. Metrics of Scale under NDA (Proxy Metrics)');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('4. Invisible Work & Operational Reliability');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('5. Technical Leadership & Engineering Standards');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('6. Experience Depth & Bullet Density Expansion');

    // 4 to 6 questions
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('MANDATORY MULTI-QUESTION INTERVIEW STRUCTURE (4 TO 6 QUESTIONS)');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('Generate between 4 and 6 surgical, high-yield questions in Portuguese');

    // Active discovery mandate
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('ACTIVE DISCOVERY of unlisted/invisible work across backstage engineering');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('STRICT PROHIBITION OF INVENTED NUMBERS');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('HIGH TECHNICAL DEPTH REQUIRED (ZERO TOLERANCE FOR SHALLOW BULLETS)');
  });

  it('buildInterviewPrompt includes active discovery mandate and elite polish mode proxy metrics guidelines', () => {
    const eliteReview: ProfileReview = {
      ...MOCK_REVIEW,
      overallScore: 94,
    };

    const prompt = buildInterviewPrompt(
      MOCK_PROFILE,
      SAMPLE_OBJECTIVE,
      'September 2026',
      eliteReview,
    );

    expect(prompt).toContain('ACTIVE DISCOVERY MANDATE:');
    expect(prompt).toContain('Generate 2 to 3 questions specifically targeting UNLISTED / INVISIBLE engineering achievements');
    expect(prompt).toContain('ELITE POLISH MODE (Modo Lapidação):');
    expect(prompt).toContain('Quantifiable business outcomes and NDA-safe proxy metrics');
  });

  it('INTERVIEW_PROGRESS_SYSTEM_PROMPT mandates comprehensive facts extraction with zero information loss', () => {
    expect(INTERVIEW_PROGRESS_SYSTEM_PROMPT).toContain('Comprehensive Technical Facts Extraction (Zero Information Loss)');
    expect(INTERVIEW_PROGRESS_SYSTEM_PROMPT).toContain('You MUST extract at least 1 to 2 distinct, granular technical facts for EVERY answered question');
  });

  it('BASE_RECRUITER_INSTRUCTIONS enshrines the Seniority Maturity Matrix and Relative 100/100 Benchmark', () => {
    // Seniority Maturity Matrix
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('SENIORITY MATURITY MATRIX (100/100 IS RELATIVE TO TARGET ROLE)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('1. Junior (Entry / Associate)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('clean modular code, comprehensive unit test coverage');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('2. Mid-Level (Pleno)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('autonomous end-to-end delivery of complex production features');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('3. Senior');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('system design judgment and architectural trade-offs');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('4. Staff+ / Lead / Principal');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('cross-service / multi-team architectural vision');

    // Relative scoring rule
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Perfection (98–100 pts) is achievable at EVERY seniority level');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('NEVER penalize a Junior for lacking distributed system design');
  });

  it('BASE_RECRUITER_INSTRUCTIONS enshrines Anti-Goalpost Moving and deterministic re-evaluations', () => {
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('ANTI-GOALPOST MOVING & DETERMINISTIC RE-EVALUATION GUARANTEE');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('1. Exhaustive First Scan (Scan 1)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('2. Objective Resolution Recognition (Scan 2 / 3 / N)');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('3. Strict Ban on Moving Goalposts');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('strictly forbidden from inventing new phantom complaints');
  });

  it('buildDiagnoseProfilePrompt and buildParseAndDiagnosePrompt inject Anti-Goalpost Moving and Maturity calibration', () => {
    const diagPrompt = buildDiagnoseProfilePrompt(MOCK_PROFILE, 'September 2026', 'Junior Full Stack Engineer');
    expect(diagPrompt).toContain('ZERO PHANTOM DEDUCTIONS, MATURITY CALIBRATION & ANTI-GOALPOST MOVING');
    expect(diagPrompt).toContain('Calibrate relative to the candidate\'s target seniority');
    expect(diagPrompt).toContain('Do NOT invent new arbitrary complaints or move the goalposts across re-scans');

    const parseDiagPrompt = buildParseAndDiagnosePrompt('Raw text', 'September 2026', 'Mid-Level Backend Engineer');
    expect(parseDiagPrompt).toContain('ZERO PHANTOM DEDUCTIONS, MATURITY CALIBRATION & ANTI-GOALPOST MOVING');
    expect(parseDiagPrompt).toContain('Calibrate relative to the candidate\'s target seniority');
    expect(parseDiagPrompt).toContain('Do NOT invent new arbitrary complaints or move the goalposts across re-scans');
  });
});

describe('Profile Rewrite ATS Rules & Hard Constraints', () => {
  it('REWRITE_PROFILE_SYSTEM_PROMPT enforces 160-char headline formula, 250-char hook, bullet density, and zero information loss', () => {
    // Headline formula
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('HIGH-CONVERSION RECRUITER HEADLINE FORMULA (max 160 characters)');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('[Role Anchor] | [3-4 Core Techs] | [System Scale] | [US Remote / Seniority]');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('strictly <= 160 characters');

    // About hook
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('Paragraph 1 (The Hook): Must be strictly under 250 characters');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('visible before the LinkedIn "See more" fold');

    // 100% Google XYZ bullets & zero information loss
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('100% GOOGLE XYZ BULLETS & COMPREHENSIVE SCOPE RETENTION');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('"Accomplished [X], measured by [Y], by doing [Z]"');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('ZERO INFORMATION LOSS (PRESERVE ALL CANDIDATE RESPONSIBILITIES & SCOPE)');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('Current / Recent Senior Roles: Strictly 3 to 5 exhaustive Google XYZ bullets');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('ELEVATE ORIGINAL SCOPE, NEVER DISCARD');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('SEAMLESS INTEGRATION OF INTERVIEW DISCOVERIES');

    // Invariant N -> N company preservation
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('INVARIANT N -> N (PRESERVE EVERY ORIGINAL COMPANY)');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('preserve every single company from the original profile without omitting any');

    // 5 to 7 bullets flexibility for broad scope & balanced role coverage
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('allow up to 5 to 7 bullets for broad-scope roles where the candidate owned multiple disciplines');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('BALANCED ROLE COVERAGE (ZERO DISCIPLINE OMISSION)');
    expect(REWRITE_PROFILE_SYSTEM_PROMPT).toContain('Do NOT allow one domain (such as backend) to cannibalize or erase the others');
  });

  it('INTERVIEW_SYSTEM_PROMPT and buildInterviewPrompt embody the coaching stance with presumption of good faith', () => {
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('PRESUMPTION OF GOOD FAITH & CONSTRUCTIVE DISCOVERY ACROSS ROLE FACETS');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('Always assume in good faith that the candidate genuinely operates in their target role');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('Full Stack: Proactively probe BOTH frontend/UI architecture');
    expect(INTERVIEW_SYSTEM_PROMPT).toContain('Applicable to Any Tech Role');

    const prompt = buildInterviewPrompt(MOCK_PROFILE, SAMPLE_OBJECTIVE, 'September 2026', MOCK_REVIEW);
    expect(prompt).toContain('TARGET ROLE COACHING ALIGNMENT FOR "Senior Backend Engineer"');
    expect(prompt).toContain('Assume in good faith that the candidate operates in this target role');
  });

  it('BASE_RECRUITER_INSTRUCTIONS validates Backend-Leaning Full Stack without penalizing positioning', () => {
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Stack Asymmetry & Backend-Leaning Full Stack');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('treat this as a high-value competitive advantage ("Backend-Leaning Full Stack")');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Do NOT penalize positioning clarity or suggest abandoning Full Stack');
    expect(PARSE_AND_DIAGNOSE_SYSTEM_PROMPT).toContain('Only flag a critical triage bottleneck if a candidate claims Full Stack but has literally ZERO frontend');
  });

  it('buildRewriteProfilePrompt injects explicit ATS rules and non-regression invariant', () => {
    const confirmedFacts: ConfirmedFact[] = [
      {
        id: 'fact-1',
        statement: 'Reduziu latência p99 de 1.2s para 150ms em cluster Kafka com 20M msgs/dia',
        source: 'interview',
        sourceReference: 'Interview reference',
        confirmed: true,
      },
    ];

    const prompt = buildRewriteProfilePrompt(
      MOCK_PROFILE,
      SAMPLE_OBJECTIVE,
      confirmedFacts,
      MOCK_REVIEW,
      'September 2026',
    );

    expect(prompt).toContain('PROFILE REWRITE ATS RULES & HARD CONSTRAINTS:');
    expect(prompt).toContain('Headline formula (max 160 characters):');
    expect(prompt).toContain('[Role Anchor] | [3-4 Core Techs] | [System Scale] | [US Remote / Seniority]');
    expect(prompt).toContain('About hook (first 250 characters):');
    expect(prompt).toContain('strictly under 250 characters');
    expect(prompt).toContain('100% Google XYZ bullets & High Bullet Density:');
    expect(prompt).toContain('"Accomplished [X], measured by [Y], by doing [Z]"');
    expect(prompt).toContain('Invariant N -> N (Company Preservation):');
    expect(prompt).toContain('Preserve every single company from the original profile');
    expect(prompt).toContain('STRICT NON-REGRESSION INVARIANT:');
    expect(prompt).toContain('Reduziu latência p99 de 1.2s para 150ms em cluster Kafka com 20M msgs/dia');
  });

  it('buildRewriteProfilePrompt incorporates candidate interview answers when provided', () => {
    const answers: InterviewAnswer[] = [
      {
        questionId: 'q-1',
        value: 'Corrigimos brecha de subscription para 200+ contas usando BullMQ e idempotency keys no PostgreSQL',
        skipped: false,
      },
    ];

    const prompt = buildRewriteProfilePrompt(
      MOCK_PROFILE,
      SAMPLE_OBJECTIVE,
      [],
      MOCK_REVIEW,
      'September 2026',
      answers,
    );

    expect(prompt).toContain('Candidate Interview Answers & Discovered Technical Context:');
    expect(prompt).toContain('Corrigimos brecha de subscription para 200+ contas usando BullMQ e idempotency keys no PostgreSQL');
  });

  describe('Sparse Experience Bullet Density Audit in Interview Generation', () => {
    it('accurately counts bullets and sentences in experience descriptions', () => {
      expect(getExperienceBulletCount({ description: 'Bullet 1\n• Bullet 2\n- Bullet 3' })).toBe(2);
      expect(
        getExperienceBulletCount({
          description:
            'Responsável pelo desenvolvimento de APIs REST em Spring Boot. Participei da migração de legado monolítico para microserviços. Atuei com PostgreSQL e mensageria Kafka.',
        }),
      ).toBe(3);
      expect(getExperienceBulletCount({ bullets: ['B1', 'B2', 'B3', 'B4', 'B5'] })).toBe(5);
    });

    it('detects experiences with <= 3 bullets as sparse', () => {
      const sparse = detectSparseExperiences(MOCK_PROFILE.experiences);
      expect(sparse.length).toBeGreaterThan(0);
      expect(sparse.some((s) => s.company === 'Fintech Pagamentos Brasil')).toBe(true);
      expect(sparse.some((s) => s.company === 'Varejo Online S.A.')).toBe(true);
    });

    it('injects SPARSE EXPERIENCE BULLET DENSITY ALERT into buildInterviewPrompt when sparse experiences exist', () => {
      const prompt = buildInterviewPrompt(MOCK_PROFILE, SAMPLE_OBJECTIVE, 'September 2026', MOCK_REVIEW);

      expect(prompt).toContain('SPARSE EXPERIENCE BULLET DENSITY ALERT (SUB-OPTIMAL TENURE DEPTH):');
      expect(prompt).toContain('Fintech Pagamentos Brasil');
      expect(prompt).toContain('YOU MUST FORMULATE AT LEAST 1 TO 2 QUESTIONS DEDICATED TO EXPANDING THESE SPARSE EXPERIENCES:');
    });

    it('omits SPARSE EXPERIENCE ALERT when all experiences have >= 4 bullets', () => {
      const denseProfile = {
        ...MOCK_PROFILE,
        experiences: [
          {
            title: 'Staff Engineer',
            companyName: 'Scale Corp',
            current: true,
            description: '• Item 1\n• Item 2\n• Item 3\n• Item 4\n• Item 5',
          },
        ],
      };

      const prompt = buildInterviewPrompt(denseProfile, SAMPLE_OBJECTIVE, 'September 2026', MOCK_REVIEW);
      expect(prompt).not.toContain('SPARSE EXPERIENCE BULLET DENSITY ALERT (SUB-OPTIMAL TENURE DEPTH):');
    });

    it('INTERVIEW_SYSTEM_PROMPT includes the 6th axis for Experience Depth & Bullet Density Expansion', () => {
      expect(INTERVIEW_SYSTEM_PROMPT).toContain('THE 6 CORE AXES OF THE US TECH RECRUITER PLAYBOOK:');
      expect(INTERVIEW_SYSTEM_PROMPT).toContain('Experience Depth & Bullet Density Expansion');
      expect(INTERVIEW_SYSTEM_PROMPT).toContain('SPARSE EXPERIENCE BULLET DENSITY EXPANSION');
    });
  });
});

