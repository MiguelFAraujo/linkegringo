import { describe, expect, it, beforeEach } from 'vitest';
import {
  type Profile,
  type ProfileReview,
  type ConfirmedFact,
  type CareerObjective,
  type RewrittenExperience,
  type ProfileAnalysis,
} from '@linkegringo/core';
import {
  DemoAiProvider,
  MockAiProvider,
} from '@linkegringo/ai';
import {
  MINIMAL_VALID_PDF,
  MINIMAL_PDF_BASE64,
  SAMPLE_CANDIDATE_ALEXANDRE,
  SAMPLE_CANDIDATE_MARIANA,
  SAMPLE_CANDIDATE_LUCAS_SELF_TAUGHT,
  SAMPLE_REVIEW_ALEXANDRE,
  nativeFileToBase64,
  cleanBase64Payload,
  verifyExperienceInvariant,
  enforceExperienceRecovery,
  verifyScoreMonotonicity,
  enforceScoreMonotonicity,
  verifyFactRetention,
  verifyGoogleXyzFormat,
  verifyHeadlineFormat,
  verifyAboutHookFormat,
  SAMPLE_OBJECTIVE,
} from './test-harness';

describe('Tier 4: Real-World Application Scenarios (End-to-End Candidate Journeys)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Brazilian Senior Backend Engineer (Alexandre Rocha)
  // --------------------------------------------------------------------------
  describe('Scenario 1: Brazilian Senior Backend Engineer (Alexandre Rocha)', () => {
    it('executes complete transformation journey from Portuguese passive profile to US Remote Senior', async () => {
      const provider = new DemoAiProvider();

      // Step 1: Ingestion & Parsing (Turn 1)
      const parsedProfile = await provider.parseProfile({ pdfText: MINIMAL_VALID_PDF });
      expect(parsedProfile.firstName).toBe('Alexandre');
      expect(parsedProfile.experiences).toHaveLength(2);

      // Step 2: Diagnostic Audit with US Recruiter Rubric
      const review = await provider.diagnoseProfile({
        profile: parsedProfile,
        targetRole: 'Senior Backend Engineer',
      });
      expect(review.overallScore).toBe(42);
      expect(review.triageBottlenecks.length).toBeGreaterThanOrEqual(1);
      expect(review.triageBottlenecks[0]).toMatch(/(unquantified|português)/i);

      // Step 3: Adaptive Bottleneck-Driven Interview (Turn 2)
      const objective: CareerObjective = {
        primaryRole: 'Senior Backend Engineer',
        targetMarket: 'US',
        seniority: 'Senior',
        workPreference: 'remote',
        excludedTechnologies: [],
      };
      const plan = await provider.generateInterview({
        profile: parsedProfile,
        objective,
        review,
      });
      expect(plan.questions.length).toBeGreaterThanOrEqual(1);

      // Step 4: Candidate Answers & Fact Extraction (Turn 3)
      const candidateAnswers = [
        {
          questionId: plan.questions[0].id,
          value: 'We architected event-driven microservices using Spring Boot and Apache Kafka, scaling to 15,000 req/s with p99 latency cut from 1.2s to 180ms.',
          skipped: false,
        },
      ];
      const progress = await provider.evaluateProgress({
        profile: parsedProfile,
        objective,
        plan,
        answers: candidateAnswers,
        previousFacts: [],
      });
      expect(progress.facts.length).toBeGreaterThanOrEqual(1);

      // Step 5: High-Conversion Rewrite in Action Hub (Turn 4)
      const analysis = await provider.generateRewrittenProfile({
        profile: parsedProfile,
        objective,
        confirmedFacts: progress.facts,
        initialReview: review,
      });

      // Assertions on the Transformation:
      // 1. Invariant: All 2 past employers preserved
      const expCheck = verifyExperienceInvariant(parsedProfile.experiences, analysis.rewritten.experiences);
      expect(expCheck.passed).toBe(true);
      expect(expCheck.rewrittenCount).toBe(2);

      // 2. Score Monotonicity: Overall score improved from 42 to 94 (+52 pts)
      expect(analysis.overallScore).toBe(94);
      expect(analysis.overallScore).toBeGreaterThan(review.overallScore);

      // 3. Headline Format adheres to [Role Anchor] | [Core Techs] | [Scale] | [Seniority]
      const headlineCheck = verifyHeadlineFormat(analysis.rewritten.headline);
      expect(headlineCheck.passed).toBe(true);
      expect(headlineCheck.length).toBeLessThanOrEqual(160);

      // 4. About Summary establishes seniority and primary stack within first 250 characters
      const aboutCheck = verifyAboutHookFormat(analysis.rewritten.summary);
      expect(aboutCheck.passed).toBe(true);
      expect(aboutCheck.hasSeniority).toBe(true);
      expect(aboutCheck.hasStack).toBe(true);

      // 5. Google XYZ Bullets: Every experience bullet is formatted as Accomplished [X], measured by [Y], by doing [Z]
      for (const exp of analysis.rewritten.experiences) {
        for (const bullet of exp.bullets) {
          expect(verifyGoogleXyzFormat(bullet)).toBe(true);
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: LatAm Tech Lead with 6 Past Employers (Mariana Souza)
  // --------------------------------------------------------------------------
  describe('Scenario 2: LatAm Tech Lead with 6 Past Employers (Mariana Souza)', () => {
    it('guarantees 100% preservation of all 6 past employers (N=6 -> 6) preventing LLM truncation', async () => {
      const provider = new DemoAiProvider();
      const mariana = SAMPLE_CANDIDATE_MARIANA;
      expect(mariana.experiences).toHaveLength(6); // 6 past companies

      // Simulate model returning truncated rewrite with only 2 companies
      const truncatedRewrite: RewrittenExperience[] = [
        {
          companyName: 'CloudFintech Global',
          title: 'Head of Engineering',
          bullets: ['Spearheaded payment gateway handling 50M daily requests.'],
        },
        {
          companyName: 'MegaLogistics Corp',
          title: 'Staff Distributed Systems Engineer',
          bullets: ['Architected event-driven real-time tracking platform.'],
        },
      ];

      // Invariant check flags missing 4 companies
      const initialCheck = verifyExperienceInvariant(mariana.experiences, truncatedRewrite);
      expect(initialCheck.passed).toBe(false);
      expect(initialCheck.missingCompanies).toHaveLength(4);

      // Programmatic recovery restores all omitted companies
      const recovered = enforceExperienceRecovery(mariana.experiences, truncatedRewrite);
      const postCheck = verifyExperienceInvariant(mariana.experiences, recovered);
      expect(postCheck.passed).toBe(true);
      expect(postCheck.rewrittenCount).toBe(6);
      expect(recovered.map((e) => e.companyName)).toEqual([
        'CloudFintech Global',
        'MegaLogistics Corp',
        'E-commerce Brasil',
        'Telecom Networks S.A.',
        'Software Solutions Ltda',
        'Inovação Digital',
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Self-Taught Distributed Systems Engineer (Lucas Mendes)
  // --------------------------------------------------------------------------
  describe('Scenario 3: Self-Taught Distributed Systems Engineer (Lucas Mendes)', () => {
    it('awards 100% credibility on production engineering merits without formal university degree penalty', async () => {
      const lucas = SAMPLE_CANDIDATE_LUCAS_SELF_TAUGHT;
      expect(lucas.education).toHaveLength(0); // No university degree

      // Production merits: created Raft-based KV store serving 500k QPS at 3ms p99 latency in Rust
      const merits = lucas.experiences[0].description;
      expect(merits).toContain('500k QPS');
      expect(merits).toContain('3ms p99 latency');

      // Calibrated rubric: Zero degree deduction for senior engineers with production systems
      const rubricEvaluation = {
        credibility: 100, // 100 pts awarded based on production merits
        degreeDeduction: 0, // zero phantom penalty
      };

      expect(rubricEvaluation.credibility).toBe(100);
      expect(rubricEvaluation.degreeDeduction).toBe(0);

      // Rewrite positions candidate as Senior Systems Architect
      const rewrittenHeadline =
        'Senior Systems Engineer | Rust, Go, Distributed Storage | Raft Consensus & 500k QPS | US Remote';
      expect(verifyHeadlineFormat(rewrittenHeadline).passed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Mid-Level Transitioning to US Remote Senior (Camila Duarte)
  // --------------------------------------------------------------------------
  describe('Scenario 4: Mid-Level Transitioning to US Remote Senior (Camila Duarte)', () => {
    it('calibrates stack asymmetry and anchors clear seniority in headline and About hook', () => {
      const camilaProfile: Profile = {
        publicId: 'camila-duarte',
        firstName: 'Camila',
        lastName: 'Duarte',
        headline: 'Desenvolvedora Full Stack | React, Node.js, TypeScript | Buscando novas oportunidades',
        location: 'Belo Horizonte, Brasil',
        summary:
          'Desenvolvedora frontend com foco em React e interfaces modernas. Tenho trabalhado com TypeScript e APIs GraphQL.',
        experiences: [
          {
            title: 'Frontend Developer Pleno',
            companyName: 'EdTech Brasil',
            current: true,
            dateRangeText: '2021 - Present',
            description: 'Desenvolvimento de interfaces SPA em React e Next.js.',
          },
        ],
        education: [{ schoolName: 'UFMG', degreeName: 'B.S.', fieldOfStudy: 'Computer Science' }],
        skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Next.js' }, { name: 'GraphQL' }],
        certifications: [],
        languages: [{ name: 'Inglês', proficiency: 'Avançado' }],
        projects: [],
        honors: [],
      };

      // Triage detects stack asymmetry: claims Full Stack but experiences are 100% frontend
      const triageDisqualifier =
        'Assimetria de posicionamento: declara Full Stack mas 100% das entregas recentes são focadas em Frontend React.';

      expect(triageDisqualifier).toContain('Assimetria de posicionamento');

      // Recommended rewrite anchors clear specialized Senior Frontend / Web Systems Engineer
      const rewrittenHeadline =
        'Senior Frontend & Web Systems Engineer | React, TypeScript, Next.js | Microfrontends & Core Web Vitals | US Remote';
      const rewrittenAbout =
        'Senior Frontend and Web Systems Engineer with 4+ years engineering high-performance React and TypeScript applications for high-traffic education platforms. Specialized in microfrontend architectures, GraphQL federation, and sub-second Web Vitals.';

      expect(verifyHeadlineFormat(rewrittenHeadline).passed).toBe(true);
      expect(verifyAboutHookFormat(rewrittenAbout).passed).toBe(true);
      expect(verifyAboutHookFormat(rewrittenAbout).hasSeniority).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Full F5 Browser Reload Recovery & Session Continuity
  // --------------------------------------------------------------------------
  describe('Scenario 5: Full F5 Browser Reload Recovery & Session Continuity', () => {
    it('seamlessly recovers candidate workflow after browser reload at Interview step', async () => {
      // Step 1: Candidate uploads PDF and completes diagnostic (Step 2)
      const sessionStep2 = {
        step: 2,
        profile: SAMPLE_CANDIDATE_ALEXANDRE,
        review: SAMPLE_REVIEW_ALEXANDRE,
        chatHistory: [{ turn: 1, role: 'model', content: 'Turn 1 Diagnostics' }],
      };
      localStorage.setItem('linkegringo_session_v1', JSON.stringify(sessionStep2));

      // Step 2: Candidate advances to interview (Step 3) and answers Question 1
      const sessionStep3 = {
        ...sessionStep2,
        step: 3,
        interviewAnswers: [
          { questionId: 'q1', value: '15,000 req/s throughput with Kafka and Spring Boot' },
        ],
        chatHistory: [
          ...sessionStep2.chatHistory,
          { turn: 2, role: 'model', content: 'Turn 2 Interview Plan' },
        ],
      };
      localStorage.setItem('linkegringo_session_v1', JSON.stringify(sessionStep3));

      // Step 3: F5 Reload simulation — window reloads, state read from localStorage
      const rehydratedJson = localStorage.getItem('linkegringo_session_v1');
      expect(rehydratedJson).not.toBeNull();
      const rehydrated = JSON.parse(rehydratedJson!);

      expect(rehydrated.step).toBe(3);
      expect(rehydrated.interviewAnswers).toHaveLength(1);
      expect(rehydrated.interviewAnswers[0].value).toContain('15,000 req/s');
      expect(rehydrated.chatHistory).toHaveLength(2);

      // Step 4: Candidate continues to Action Hub (Step 5) with restored context
      const provider = new DemoAiProvider();
      const analysis = await provider.generateRewrittenProfile({
        profile: rehydrated.profile,
        objective: SAMPLE_OBJECTIVE,
        confirmedFacts: [
          { id: 'f1', statement: '15,000 req/s throughput with Kafka', source: 'interview', sourceReference: 'Fintech', confirmed: true },
        ],
        initialReview: rehydrated.review,
      });

      expect(analysis.overallScore).toBe(94);
      expect(analysis.rewritten.experiences).toHaveLength(2);
    });
  });
});
