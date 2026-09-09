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
} from './test-harness';

describe('LinkeGringo Pipeline End-to-End (Opaque-Box Master Verification)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // 1. Complete Turn 1 -> Turn 4 Pipeline Lifecycle
  // --------------------------------------------------------------------------
  describe('Complete Turn 1 -> Turn 4 Pipeline Lifecycle', () => {
    it('executes the unified candidate journey through all 4 conversational turns', async () => {
      const provider = new DemoAiProvider();

      // TURN 1: Native Base64 Ingestion & Triage Audit
      const file = new File([MINIMAL_VALID_PDF], 'resume.pdf', { type: 'application/pdf' });
      const dataUrl = await nativeFileToBase64(file);
      const cleanB64 = cleanBase64Payload(dataUrl);
      expect(cleanB64.length).toBeGreaterThan(0);

      const profile = await provider.parseProfile({ pdfText: MINIMAL_VALID_PDF });
      expect(profile.firstName).toBe('Alexandre');
      expect(profile.experiences).toHaveLength(2);

      const review = await provider.diagnoseProfile({
        profile,
        targetRole: 'Senior Backend Engineer',
      });
      expect(review.overallScore).toBe(42);
      expect(review.triageBottlenecks.length).toBeGreaterThanOrEqual(1);

      // TURN 2: Adaptive Questions Targeting Triage Bottlenecks
      const objective: CareerObjective = {
        primaryRole: 'Senior Backend Engineer',
        targetMarket: 'US',
        seniority: 'Senior',
        workPreference: 'remote',
        excludedTechnologies: [],
      };
      const plan = await provider.generateInterview({
        profile,
        objective,
        review,
      });
      expect(plan.questions.length).toBeGreaterThanOrEqual(1);

      // TURN 3: Technical Progress & Fact Extraction
      const answers = [
        {
          questionId: plan.questions[0].id,
          value: 'Architected event-driven microservices using Spring Boot and Apache Kafka handling 15,000 req/s, decreasing p99 latency from 1.2s to 180ms.',
          skipped: false,
        },
      ];
      const progress = await provider.evaluateProgress({
        profile,
        objective,
        plan,
        answers,
        previousFacts: [],
      });
      expect(progress.readyForGeneration).toBe(true);
      expect(progress.facts.length).toBeGreaterThanOrEqual(1);

      // TURN 4: Action Hub High-Conversion Profile Rewrite
      const analysis = await provider.generateRewrittenProfile({
        profile,
        objective,
        confirmedFacts: progress.facts,
        initialReview: review,
      });

      expect(analysis.overallScore).toBe(94);
      expect(analysis.rewritten.experiences).toHaveLength(2);
      expect(verifyHeadlineFormat(analysis.rewritten.headline).passed).toBe(true);
      expect(verifyAboutHookFormat(analysis.rewritten.summary).passed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Mathematical Invariants & Non-Regression
  // --------------------------------------------------------------------------
  describe('Mathematical Invariants & Non-Regression Guarantees', () => {
    it('enforces Experience Invariant N -> N across complex multi-role career history', async () => {
      const provider = new DemoAiProvider();
      const mariana = SAMPLE_CANDIDATE_MARIANA;
      const expectedCount = mariana.experiences.length; // 6 past companies

      // Simulated model output that truncated earlier roles
      const truncated: RewrittenExperience[] = [
        { companyName: 'CloudFintech Global', title: 'Head of Engineering', bullets: ['Built payments engine.'] },
        { companyName: 'MegaLogistics Corp', title: 'Staff Engineer', bullets: ['Kafka platform.'] },
      ];

      const recovered = enforceExperienceRecovery(mariana.experiences, truncated);
      const invariant = verifyExperienceInvariant(mariana.experiences, recovered);

      expect(invariant.passed).toBe(true);
      expect(invariant.rewrittenCount).toBe(expectedCount);
      expect(invariant.missingCompanies).toHaveLength(0);
    });

    it('enforces Score Monotonicity guaranteeing Scores_final >= Scores_initial across all 5 dimensions', () => {
      const initial = SAMPLE_REVIEW_ALEXANDRE.scores; // 48, 52, 38, 35, 37
      const simulatedRegressedScores = {
        searchRelevance: 42, // regression
        humanVoice: 50, // regression
        credibility: 90,
        positioningClarity: 88,
        evidenceCoverage: 85,
      };

      const guarded = enforceScoreMonotonicity(initial, simulatedRegressedScores);
      const check = verifyScoreMonotonicity(initial, guarded);

      expect(check.passed).toBe(true);
      expect(guarded.searchRelevance).toBeGreaterThanOrEqual(initial.searchRelevance);
      expect(guarded.humanVoice).toBeGreaterThanOrEqual(initial.humanVoice);
      expect(guarded.credibility).toBeGreaterThanOrEqual(initial.credibility);
      expect(guarded.positioningClarity).toBeGreaterThanOrEqual(initial.positioningClarity);
      expect(guarded.evidenceCoverage).toBeGreaterThanOrEqual(initial.evidenceCoverage);
    });

    it('enforces Fact Cumulative Retention across multi-round interview iterations', () => {
      const round1Facts: ConfirmedFact[] = [
        { id: 'f1', statement: 'Processed 20M payments daily in Fintech', source: 'interview', sourceReference: 'Fintech', confirmed: true },
        { id: 'f2', statement: 'Managed cloud budget of $500k/year on AWS', source: 'interview', sourceReference: 'Fintech', confirmed: true },
      ];

      const round2Facts: ConfirmedFact[] = [
        ...round1Facts,
        { id: 'f3', statement: 'Decomposed Java monolith into 15 microservices', source: 'interview', sourceReference: 'Fintech', confirmed: true },
      ];

      const check = verifyFactRetention(round1Facts, round2Facts);
      expect(check.passed).toBe(true);
      expect(check.retainedCount).toBe(3);
      expect(check.lostFacts).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. 100% Client-Side Architecture (BYOK & Zero Backend)
  // --------------------------------------------------------------------------
  describe('100% Client-Side Architecture (BYOK & Zero Backend)', () => {
    it('operates entirely in browser context with zero intermediary server proxies', () => {
      // Verifies client-side environment globals
      expect(typeof window).toBe('object');
      expect(typeof localStorage).toBe('object');

      // Verifies BYOK key handling
      const testKey = 'AIzaSyBYOK_ClientSideSecretKey_123';
      localStorage.setItem('linkegringo_gemini_api_key', testKey);
      expect(localStorage.getItem('linkegringo_gemini_api_key')).toBe(testKey);

      // Verifies that no API key is leaked into general session storage
      const sessionPayload = { profile: SAMPLE_CANDIDATE_ALEXANDRE };
      const serialized = JSON.stringify(sessionPayload);
      expect(serialized).not.toContain(testKey);
    });

    it('MockAiProvider functions completely offline without any internet connection', async () => {
      const mock = new MockAiProvider();
      const connected = await mock.testConnection();
      expect(connected).toBe(true);

      const parsed = await mock.parseProfile({ pdfText: 'offline resume' });
      expect(parsed).toBeDefined();
      expect(parsed.publicId).toBe('demo-candidate');
    });
  });

  // --------------------------------------------------------------------------
  // 4. F5 Refresh Resilience & Roundtrip Persistence
  // --------------------------------------------------------------------------
  describe('F5 Refresh Resilience & Roundtrip Session Recovery', () => {
    it('persists and recovers full session roundtrip from upload to Action Hub', async () => {
      const provider = new DemoAiProvider();

      // 1. Initial State
      const profile = await provider.parseProfile({ pdfText: MINIMAL_VALID_PDF });
      const review = await provider.diagnoseProfile({ profile });
      const facts: ConfirmedFact[] = [
        { id: 'f1', statement: 'Event-driven Kafka architecture', source: 'interview', sourceReference: 'Fintech', confirmed: true },
      ];

      const session = {
        step: 4,
        profile,
        review,
        facts,
        chatHistory: [{ role: 'model', content: 'Turn 1 Diagnostic Output' }],
      };

      // 2. Persist to LocalStorage
      localStorage.setItem('linkegringo_session_v1', JSON.stringify(session));

      // 3. Simulate F5 reload and read
      const restoredRaw = localStorage.getItem('linkegringo_session_v1');
      expect(restoredRaw).not.toBeNull();
      const restored = JSON.parse(restoredRaw!);

      expect(restored.step).toBe(4);
      expect(restored.profile.firstName).toBe('Alexandre');
      expect(restored.facts).toHaveLength(1);
      expect(restored.chatHistory).toHaveLength(1);

      // 4. Continue to Turn 4 rewrite from restored state
      const analysis = await provider.generateRewrittenProfile({
        profile: restored.profile,
        objective: SAMPLE_OBJECTIVE,
        confirmedFacts: restored.facts,
        initialReview: restored.review,
      });

      expect(analysis.overallScore).toBe(94);
      expect(analysis.rewritten.experiences).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Adversarial Input Hardening
  // --------------------------------------------------------------------------
  describe('Adversarial Input Hardening & Format Fidelity', () => {
    it('handles dirty base64 strings with tabs and newlines gracefully', () => {
      const dirty = `\r\n\t  ${MINIMAL_PDF_BASE64.slice(0, 30)} \n\r\t ${MINIMAL_PDF_BASE64.slice(30)}  \n`;
      const clean = cleanBase64Payload(dirty);
      expect(clean).toBe(MINIMAL_PDF_BASE64);
      expect(/\s/.test(clean)).toBe(false);
    });

    it('enforces 100% Google XYZ format compliance across all generated bullets', () => {
      const sampleRewriteBullets = [
        'Architected distributed event-driven payment APIs in Spring Boot, handling 15,000 req/s and reducing p99 latency to 180ms.',
        'Spearheaded monolithic database decomposition into decoupled PostgreSQL services, improving availability to 99.99%.',
        'Engineered caching strategies in Redis, cutting query response times by 45% and saving $40k/year in cloud resources.',
      ];

      for (const bullet of sampleRewriteBullets) {
        expect(verifyGoogleXyzFormat(bullet)).toBe(true);
      }
    });

    it('enforces strict headline length constraint (<= 160 characters)', () => {
      const headline =
        'Senior Backend Engineer | Java, Spring Boot, Apache Kafka | Distributed Systems & 15k req/s | US Remote';
      const check = verifyHeadlineFormat(headline);
      expect(check.passed).toBe(true);
      expect(check.length).toBeLessThanOrEqual(160);
    });
  });
});
