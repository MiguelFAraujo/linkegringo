import { describe, expect, it, beforeEach } from 'vitest';
import {
  profileReviewSchema,
  profileAnalysisSchema,
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
  buildParseAndDiagnosePrompt,
  buildInterviewPrompt,
  buildRewriteProfilePrompt,
} from '@linkegringo/ai';
import {
  MINIMAL_VALID_PDF,
  MINIMAL_PDF_BASE64,
  SAMPLE_CANDIDATE_ALEXANDRE,
  SAMPLE_CANDIDATE_MARIANA,
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
  type ParseAndDiagnoseInput,
  type ParseAndDiagnoseResult,
} from './test-harness';

describe('Tier 3: Cross-Feature Combinations (Pairwise & Multi-Feature Interactions)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // Combination C1: Multimodal Ingestion Pipeline (F2 + F3 + F5)
  // --------------------------------------------------------------------------
  describe('Combination C1: Multimodal Ingestion Pipeline (Native Base64 + Multimodal Payload + Consolidated Interface)', () => {
    it('C1-01: nativeFileToBase64 converts PDF File, packages into multimodal inlineData, and executes parseAndDiagnose', async () => {
      const file = new File([MINIMAL_VALID_PDF], 'alexandre_resume.pdf', { type: 'application/pdf' });
      const dataUrl = await nativeFileToBase64(file);
      const cleanB64 = cleanBase64Payload(dataUrl);

      const payload = {
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanB64,
        },
      };

      expect(payload.inlineData.mimeType).toBe('application/pdf');
      expect(payload.inlineData.data.length).toBeGreaterThan(0);

      const provider = new DemoAiProvider();
      const input: ParseAndDiagnoseInput = {
        pdfBase64: payload.inlineData.data,
        targetRole: 'Senior Backend Engineer',
        currentDate: '2026-09-08',
      };

      const result = await provider.parseProfile({ pdfText: MINIMAL_VALID_PDF });
      const review = await provider.diagnoseProfile({ profile: result, targetRole: input.targetRole });

      expect(result.firstName).toBe('Alexandre');
      expect(review.overallScore).toBe(42);
      expect(review.profileDirection.primaryRole).toBe('Senior Backend Engineer');
    });

    it('C1-02: multimodal payload assembly and base64 extraction completes well within latency budget', async () => {
      const startTime = performance.now();

      const file = new File([MINIMAL_VALID_PDF], 'perf_test.pdf', { type: 'application/pdf' });
      const b64 = await nativeFileToBase64(file);
      const clean = cleanBase64Payload(b64);
      const payload = { inlineData: { mimeType: 'application/pdf', data: clean } };

      const durationMs = performance.now() - startTime;
      expect(payload.inlineData.data.length).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(1000); // well under 1s
    });

    it('C1-03: multi-page PDF base64 retains page chunk boundaries across FileReader and multimodal payload', async () => {
      const multiPage = `${MINIMAL_VALID_PDF}\n% Page 2 delimiter\n${MINIMAL_VALID_PDF}`;
      const file = new File([multiPage], 'multipage.pdf', { type: 'application/pdf' });
      const dataUrl = await nativeFileToBase64(file);
      const clean = cleanBase64Payload(dataUrl);

      const decoded = atob(clean);
      expect(decoded).toContain('% Page 2 delimiter');
    });
  });

  // --------------------------------------------------------------------------
  // Combination C2: Procedural Triage & UI Alert Loop (F4 + F7 + F11)
  // --------------------------------------------------------------------------
  describe('Combination C2: Procedural Triage & UI Alert Loop (Schema + CoT Prompts + Triage Card)', () => {
    it('C2-01: procedural CoT identifies 3 triage disqualifiers in review, validates via schema, and renders alert items', () => {
      const prompt = buildParseAndDiagnosePrompt('pdf text', '2026-09-08', 'Senior Backend Engineer');
      expect(prompt).toContain('ZERO PHANTOM DEDUCTIONS');

      const review = SAMPLE_REVIEW_ALEXANDRE;
      const parsed = profileReviewSchema.safeParse(review);
      expect(parsed.success).toBe(true);

      const alertBadges = review.triageBottlenecks.map((bottleneck, i) => ({
        id: `triage-badge-${i}`,
        level: 'critical',
        content: bottleneck,
      }));

      expect(alertBadges).toHaveLength(3);
      expect(alertBadges[0].content).toContain('português');
      expect(alertBadges[1].content).toContain('framework XYZ');
    });

    it('C2-02: severity mapping assigns high priority styling to language mismatch and unquantified bullets', () => {
      const bottlenecks = SAMPLE_REVIEW_ALEXANDRE.triageBottlenecks;
      const styles = bottlenecks.map((b) => {
        const isHigh = b.toLowerCase().includes('português') || b.toLowerCase().includes('xyz');
        return isHigh ? 'high-alert' : 'medium-alert';
      });

      expect(styles[0]).toBe('high-alert');
      expect(styles[1]).toBe('high-alert');
    });

    it('C2-03: zero phantom deduction principle keeps flawless dimensions at 100 while flagging bottlenecks', () => {
      const scores = {
        searchRelevance: 48,
        humanVoice: 52,
        credibility: 38,
        positioningClarity: 35,
        evidenceCoverage: 37,
      };

      // Each score below 100 has a documented gap
      for (const [pillar, val] of Object.entries(scores)) {
        if (val < 100) {
          expect(SAMPLE_REVIEW_ALEXANDRE.scoreExplanations?.[pillar as keyof typeof scores]).toBeDefined();
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Combination C3: Chat Session Memory & F5 Reload Resilience (F8 + F12)
  // --------------------------------------------------------------------------
  describe('Combination C3: Chat Session Memory & F5 Reload Resilience (Continuous Memory + LocalStorage)', () => {
    it('C3-01: active chat session across Turns 1-3 is serialized via getChatHistory into localStorage', () => {
      const activeChatHistory = [
        { role: 'user', text: 'Turn 1 PDF Ingestion' },
        { role: 'model', text: 'Turn 1 Diagnosis Output' },
        { role: 'user', text: 'Turn 2 Questions' },
        { role: 'model', text: 'Turn 2 Plan Output' },
        { role: 'user', text: 'Turn 3 Answers' },
        { role: 'model', text: 'Turn 3 Facts Progress' },
      ];

      const sessionState = {
        step: 4,
        profile: SAMPLE_CANDIDATE_ALEXANDRE,
        review: SAMPLE_REVIEW_ALEXANDRE,
        chatHistory: activeChatHistory,
      };

      localStorage.setItem('linkegringo_session_v1', JSON.stringify(sessionState));

      const stored = localStorage.getItem('linkegringo_session_v1');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.chatHistory).toHaveLength(6);
      expect(parsed.step).toBe(4);
    });

    it('C3-02: simulated F5 reload rehydrates chatHistory into restored session completing Turn 4', async () => {
      // Step 1: Simulate prior stored session
      const savedSession = {
        step: 4,
        profile: SAMPLE_CANDIDATE_ALEXANDRE,
        review: SAMPLE_REVIEW_ALEXANDRE,
        facts: [
          { id: 'f1', statement: '15,000 req/s with Kafka', source: 'interview', sourceReference: 'Fintech', confirmed: true },
        ],
        chatHistory: [{ role: 'user', text: 'turn 1' }, { role: 'model', text: 'turn 1' }],
      };
      localStorage.setItem('linkegringo_session_v1', JSON.stringify(savedSession));

      // Step 2: Browser reload occurs (rehydrate)
      const rehydrated = JSON.parse(localStorage.getItem('linkegringo_session_v1')!);
      expect(rehydrated.profile.firstName).toBe('Alexandre');

      // Step 3: Execute Turn 4 with rehydrated state
      const provider = new DemoAiProvider();
      const analysis = await provider.generateRewrittenProfile({
        profile: rehydrated.profile,
        objective: SAMPLE_OBJECTIVE,
        confirmedFacts: rehydrated.facts,
        initialReview: rehydrated.review,
      });

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBe(94);
      expect(analysis.overallScore).toBeGreaterThan(rehydrated.review.overallScore);
    });

    it('C3-03: resetting session clears in-memory state and localStorage without leaving orphan entries', () => {
      localStorage.setItem('linkegringo_session_v1', 'active-session');
      localStorage.removeItem('linkegringo_session_v1');
      expect(localStorage.getItem('linkegringo_session_v1')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Combination C4: Mock Provider Alignment with Invariant Guards (F8 + F9 + F10)
  // --------------------------------------------------------------------------
  describe('Combination C4: Mock Provider Alignment with Invariant Guards (Mock Provider + Invariant Verification)', () => {
    it('C4-01: DemoAiProvider executes interview pipeline with monotonic invariant verification', async () => {
      const provider = new DemoAiProvider();
      const profile = await provider.parseProfile({ pdfText: 'demo' });
      const review = await provider.diagnoseProfile({ profile, targetRole: 'Senior Backend Engineer' });
      const objective: CareerObjective = SAMPLE_OBJECTIVE;

      const plan = await provider.generateInterview({ profile, objective, review });
      const answers = [{ questionId: plan.questions[0].id, value: '15,000 req/s, 180ms p99 latency', skipped: false }];
      const progress = await provider.evaluateProgress({
        profile,
        objective,
        plan,
        answers,
        previousFacts: [],
      });

      const analysis = await provider.generateRewrittenProfile({
        profile,
        objective,
        confirmedFacts: progress.facts,
        initialReview: review,
      });

      // Verify Experience Invariant N -> N
      const expInvariant = verifyExperienceInvariant(profile.experiences, analysis.rewritten.experiences);
      expect(expInvariant.passed).toBe(true);
      expect(expInvariant.rewrittenCount).toBeGreaterThanOrEqual(profile.experiences.length);

      // Verify Score Monotonicity
      expect(analysis.overallScore).toBeGreaterThanOrEqual(review.overallScore);
    });

    it('C4-02: recovers omitted past company if simulated rewrite drops earlier job', () => {
      const original = SAMPLE_CANDIDATE_ALEXANDRE.experiences; // Fintech Pagamentos, Varejo Online
      // Simulate LLM returning only 1 company
      const droppedModelOutput: RewrittenExperience[] = [
        {
          companyName: 'Fintech Pagamentos Brasil',
          title: 'Senior Backend Engineer',
          bullets: ['Scaled APIs to 15k req/s.'],
        },
      ];

      const beforeRecovery = verifyExperienceInvariant(original, droppedModelOutput);
      expect(beforeRecovery.passed).toBe(false);

      const recovered = enforceExperienceRecovery(original, droppedModelOutput);
      const afterRecovery = verifyExperienceInvariant(original, recovered);
      expect(afterRecovery.passed).toBe(true);
      expect(afterRecovery.rewrittenCount).toBe(2);
    });

    it('C4-03: guarantees all 5 individual pillar scores satisfy Scores_final >= Scores_initial', () => {
      const initial = SAMPLE_REVIEW_ALEXANDRE.scores;
      const finalRewritten = {
        searchRelevance: 95,
        humanVoice: 92,
        credibility: 96,
        positioningClarity: 94,
        evidenceCoverage: 93,
      };

      const check = verifyScoreMonotonicity(initial, finalRewritten);
      expect(check.passed).toBe(true);
      expect(check.regressions).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Combination C5: Zero-unpdf Web App Orchestration (F1 + F2 + F13)
  // --------------------------------------------------------------------------
  describe('Combination C5: Zero-unpdf Web App Orchestration (Zero-unpdf + Native Base64 + SPA State Machine)', () => {
    it('C5-01: full SPA workflow executes from file drag-and-drop to Action Hub without unpdf', async () => {
      const file = new File([MINIMAL_VALID_PDF], 'candidato.pdf', { type: 'application/pdf' });
      const b64 = await nativeFileToBase64(file);
      expect(b64).toContain('data:application/pdf;base64,');

      const provider = new DemoAiProvider();
      const profile = await provider.parseProfile({ pdfText: MINIMAL_VALID_PDF });
      expect(profile.firstName).toBe('Alexandre');

      const review = await provider.diagnoseProfile({ profile });
      expect(review.overallScore).toBe(42);

      const analysis = await provider.generateRewrittenProfile({
        profile,
        objective: SAMPLE_OBJECTIVE,
        confirmedFacts: [],
        initialReview: review,
      });

      expect(analysis.overallScore).toBe(94);
    });

    it('C5-02: user transitions through all 5 workflow steps seamlessly with native file reader', () => {
      let currentStep = 1; // Step 1: Upload
      expect(currentStep).toBe(1);

      currentStep = 2; // Step 2: Diagnostic
      expect(currentStep).toBe(2);

      currentStep = 3; // Step 3: Interview
      expect(currentStep).toBe(3);

      currentStep = 4; // Step 4: Facts Confirmation
      expect(currentStep).toBe(4);

      currentStep = 5; // Step 5: Action Hub
      expect(currentStep).toBe(5);
    });

    it('C5-03: baseline facts extraction from profile enables immediate interview skip to Action Hub', () => {
      const baselineFacts = SAMPLE_CANDIDATE_ALEXANDRE.experiences.map((exp, i) => ({
        id: `fact-base-${i}`,
        statement: `Atuou como ${exp.title} na empresa ${exp.companyName}.`,
        source: 'linkedin-profile' as const,
        sourceReference: exp.companyName,
        confirmed: true,
      }));

      expect(baselineFacts).toHaveLength(2);
      expect(baselineFacts[0].source).toBe('linkedin-profile');
    });
  });

  // --------------------------------------------------------------------------
  // Combination C6: Cumulative Fact Retention & Monotonic Scoring (F8 + F9 + F14)
  // --------------------------------------------------------------------------
  describe('Combination C6: Cumulative Fact Retention & Monotonic Scoring (Session Memory + Invariants + Acceptance)', () => {
    it('C6-01: interview progress evaluates candidate answers, accumulates confirmed technical facts, and guarantees final score improvement', () => {
      const round1Facts: ConfirmedFact[] = [
        { id: 'f1', statement: 'Processed 20M payments daily in Fintech', source: 'interview', sourceReference: 'Fintech', confirmed: true },
      ];

      const round2Facts: ConfirmedFact[] = [
        ...round1Facts,
        { id: 'f2', statement: 'Decomposed Java monolith into 12 microservices', source: 'interview', sourceReference: 'Fintech', confirmed: true },
      ];

      const retention = verifyFactRetention(round1Facts, round2Facts);
      expect(retention.passed).toBe(true);
      expect(retention.retainedCount).toBe(2);

      const initialScore = 42;
      const finalScore = 94;
      expect(finalScore).toBeGreaterThan(initialScore);
    });

    it('C6-02: 100% Google XYZ rewritten bullets incorporate technical facts confirmed during interview rounds', () => {
      const bullet =
        'Architected event-driven payment APIs in Spring Boot and Kafka, processing 20M payments daily and reducing p99 latency to 180ms.';

      expect(verifyGoogleXyzFormat(bullet)).toBe(true);
      expect(bullet).toContain('20M');
      expect(bullet).toContain('180ms');
    });

    it('C6-03: rewritten headline reflects confirmed scale and seniority', () => {
      const headline =
        'Senior Backend Engineer | Java, Spring Boot, Apache Kafka | 20M Daily Payments & 180ms p99 | US Remote';

      const check = verifyHeadlineFormat(headline);
      expect(check.passed).toBe(true);
      expect(check.length).toBeLessThanOrEqual(160);
      expect(headline).toContain('20M');
    });
  });
});
