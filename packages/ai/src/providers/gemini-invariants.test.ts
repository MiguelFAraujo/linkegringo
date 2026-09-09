import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  Profile,
  ProfileReview,
} from '@linkegringo/core';
import {
  enforceExperienceRecovery,
  GeminiAiProvider,
} from './gemini.js';

// Retain actual GenAI schema types while mocking the API client class
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: vi.fn(),
  };
});

import { GoogleGenAI } from '@google/genai';

describe('Empirical Adversarial Verification: GeminiAiProvider Invariants', () => {
  let mockChat: {
    sendMessage: ReturnType<typeof vi.fn>;
    getHistory: ReturnType<typeof vi.fn>;
  };
  let mockModels: {
    generateContent: ReturnType<typeof vi.fn>;
  };
  let mockChats: {
    create: ReturnType<typeof vi.fn>;
  };
  let chatHistoryStore: any[];

  const baseProfile: Profile = {
    publicId: 'test-adversarial',
    firstName: 'Candidate',
    lastName: 'Adversarial',
    headline: 'Staff Engineer | Distributed Systems',
    location: 'Remote',
    summary: 'Seasoned engineer.',
    experiences: [
      {
        title: 'Principal Engineer',
        companyName: 'Stripe',
        current: true,
        dateRangeText: '2023 - Present',
        description: 'Led global payment orchestration.\nImproved availability to 99.999%.',
      },
      {
        title: 'Staff Software Engineer',
        companyName: 'Airbnb',
        current: false,
        dateRangeText: '2020 - 2023',
        description: 'Architected booking search indexing.\nScaled query rate 5x.',
      },
      {
        title: 'Senior Software Engineer',
        companyName: 'Uber',
        current: false,
        dateRangeText: '2017 - 2020',
        description: 'Built dynamic dispatch algorithms in Go.',
      },
      {
        title: 'Software Engineer',
        companyName: 'Early Startup',
        current: false,
        dateRangeText: '2015 - 2017',
        description: 'Bootstrapped core SaaS backend.',
      },
    ],
    education: [],
    skills: [{ name: 'Go' }, { name: 'Distributed Systems' }],
    certifications: [],
    projects: [],
    languages: [],
    honors: [],
  };

  const baseReview: ProfileReview = {
    targetMarket: 'United States',
    language: 'en',
    overallScore: 78,
    scores: {
      searchRelevance: 85,
      humanVoice: 75,
      credibility: 80,
      positioningClarity: 72,
      evidenceCoverage: 78,
    },
    scoreExplanations: {
      searchRelevance: 'Strong keywords.',
      humanVoice: 'Direct tone.',
      credibility: 'Tier 1 tech trajectory.',
      positioningClarity: 'Clear staff level scope.',
      evidenceCoverage: 'Good metrics present.',
    },
    executiveSummary: 'Perfil sólido com trajetoria em grandes multinacionais.',
    profileDirection: {
      positioning: 'Staff Distributed Systems Engineer',
      primaryRole: 'Staff Software Engineer',
      alternativeRoles: ['Principal Systems Engineer'],
      rationale: 'Forte senioridade em mensageria e escala.',
    },
    critique: [],
    triageBottlenecks: ['Precisa quantificar impacto de receita.'],
  };

  const baseObjective: CareerObjective = {
    primaryRole: 'Staff Software Engineer',
    targetMarket: 'United States',
    workPreference: 'remote',
    excludedTechnologies: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    chatHistoryStore = [];

    mockChat = {
      sendMessage: vi.fn(),
      getHistory: vi.fn(() => [...chatHistoryStore]),
    };

    mockModels = {
      generateContent: vi.fn(),
    };

    mockChats = {
      create: vi.fn((params: any) => {
        if (Array.isArray(params?.history) && params.history.length > 0) {
          chatHistoryStore = structuredClone(params.history);
        }
        return mockChat;
      }),
    };

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: mockModels,
          chats: mockChats,
        }) as unknown as GoogleGenAI,
    );
  });

  describe('Invariant N -> N Company Recovery (enforceExperienceRecovery)', () => {
    it('recovers all companies when LLM omits 100% of experiences (N -> 0 -> N)', () => {
      const original = baseProfile.experiences; // 4 companies
      const rewritten: Array<{ companyName: string; title: string; bullets: string[] }> = [];

      const recovered = enforceExperienceRecovery(original, rewritten);

      expect(recovered).toHaveLength(4);
      const recoveredNames = recovered.map((e) => e.companyName);
      expect(recoveredNames).toEqual(['Stripe', 'Airbnb', 'Uber', 'Early Startup']);
      expect(recovered[0].bullets).toHaveLength(2);
      expect(recovered[0].bullets[0]).toContain('payment orchestration');
      expect(recovered[3].bullets[0]).toContain('core SaaS backend');
    });

    it('recovers omitted middle and tail companies while preserving rewritten modifications', () => {
      const original = baseProfile.experiences; // Stripe, Airbnb, Uber, Early Startup
      // LLM only keeps Stripe and changes its title/bullets
      const rewritten = [
        {
          companyName: 'Stripe',
          title: 'Distinguished Infrastructure Architect',
          bullets: ['Revolutionized payment routing engine.'],
        },
      ];

      const recovered = enforceExperienceRecovery(original, rewritten);

      expect(recovered).toHaveLength(4);
      // Stripe should keep the LLM rewritten content
      expect(recovered[0].companyName).toBe('Stripe');
      expect(recovered[0].title).toBe('Distinguished Infrastructure Architect');
      expect(recovered[0].bullets).toEqual(['Revolutionized payment routing engine.']);

      // Airbnb, Uber, Early Startup should be recovered
      expect(recovered[1].companyName).toBe('Airbnb');
      expect(recovered[1].title).toBe('Staff Software Engineer');
      expect(recovered[2].companyName).toBe('Uber');
      expect(recovered[3].companyName).toBe('Early Startup');
    });

    it('handles case-insensitive and whitespace-padded company deduplication', () => {
      const original = [
        { companyName: '  Stripe, Inc.  ', title: 'Senior Dev' },
        { companyName: 'Datadog', title: 'Senior Dev' },
      ];
      const rewritten = [
        {
          companyName: 'stripe, inc.',
          title: 'Principal Dev',
          bullets: ['Metrics.'],
        },
      ];

      const recovered = enforceExperienceRecovery(original, rewritten);

      expect(recovered).toHaveLength(2);
      expect(recovered[0].companyName).toBe('stripe, inc.');
      expect(recovered[1].companyName).toBe('Datadog');
    });

    it('ignores empty, null, or whitespace-only original company records safely', () => {
      const original = [
        { companyName: '', title: 'Ghost' },
        { companyName: '   ', title: 'Ghost 2' },
        null as any,
        undefined as any,
        { companyName: 'Valid Corp', title: 'Engineer' },
      ];
      const rewritten: Array<{ companyName: string; title: string; bullets: string[] }> = [];

      const recovered = enforceExperienceRecovery(original, rewritten);

      expect(recovered).toHaveLength(1);
      expect(recovered[0].companyName).toBe('Valid Corp');
      expect(recovered[0].title).toBe('Engineer');
      expect(recovered[0].bullets[0]).toContain('Valid Corp');
    });

    it('property-based generator: asserts N -> N recovery across 100 randomized company permutations', () => {
      const companyPool = [
        'Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Microsoft', 'Salesforce',
        'Oracle', 'Adobe', 'Cisco', 'Palantir', 'Snowflake', 'Spotify', 'Twitter',
      ];

      for (let iteration = 0; iteration < 100; iteration++) {
        // Random subset of 3-8 companies
        const shuffled = [...companyPool].sort(() => 0.5 - Math.random());
        const count = 3 + Math.floor(Math.random() * 6);
        const originalCompanies = shuffled.slice(0, count);

        const original = originalCompanies.map((name) => ({
          companyName: name,
          title: `Engineer at ${name}`,
          description: `Accomplished milestone at ${name}.\nMeasured by KPI.\nBy using stack.`,
        }));

        // LLM omits a random subset (keeps 0 to count - 1)
        const keepCount = Math.floor(Math.random() * count);
        const keptNames = originalCompanies.slice(0, keepCount);
        const rewritten = keptNames.map((name) => ({
          companyName: name.toUpperCase(), // Test case variation
          title: `Rewritten Staff ${name}`,
          bullets: [`Rewritten bullet for ${name}`],
        }));

        const recovered = enforceExperienceRecovery(original, rewritten);

        // Verification Oracle:
        // 1. Recovered length MUST be >= original count
        expect(recovered.length).toBeGreaterThanOrEqual(originalCompanies.length);

        // 2. Every single original company name MUST be present in recovered list (case-insensitively)
        const recoveredSet = new Set(recovered.map((r) => r.companyName.trim().toLowerCase()));
        for (const origName of originalCompanies) {
          expect(recoveredSet.has(origName.trim().toLowerCase())).toBe(true);
        }
      }
    });

    it('empirically verifies N -> N recovery during full generateRewrittenProfile execution', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      // Model returns output missing Uber and Early Startup
      const llmOutput = {
        targetMarket: 'United States',
        language: 'en',
        overallScore: 92,
        scores: {
          searchRelevance: 95,
          humanVoice: 90,
          credibility: 95,
          positioningClarity: 90,
          evidenceCoverage: 90,
        },
        executiveSummary: 'Staff profile summary.',
        profileDirection: baseReview.profileDirection,
        critique: [],
        triageBottlenecks: [],
        rewritten: {
          headline: 'Staff Software Engineer | Go, Distributed Systems | High Scale',
          summary: 'Executive summary.\n\nKey Competencies: Go, Kafka.',
          experiences: [
            {
              title: 'Staff Software Engineer',
              companyName: 'Stripe',
              bullets: ['Orchestrated global payments.'],
            },
            {
              title: 'Staff Software Engineer',
              companyName: 'Airbnb',
              bullets: ['Scaled indexing.'],
            },
            // Uber and Early Startup omitted by LLM
          ],
          skills: ['Go', 'Distributed Systems'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(llmOutput),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: baseProfile, // Has 4 companies: Stripe, Airbnb, Uber, Early Startup
        objective: baseObjective,
        confirmedFacts: [],
        initialReview: baseReview,
      });

      expect(analysis.rewritten.experiences).toHaveLength(4);
      const names = analysis.rewritten.experiences.map((e) => e.companyName);
      expect(names).toContain('Stripe');
      expect(names).toContain('Airbnb');
      expect(names).toContain('Uber');
      expect(names).toContain('Early Startup');
    });
  });

  describe('Score Monotonicity Verification (Scores_final >= Scores_initial)', () => {
    it('strictly enforces monotonicity across all 5 dimensions and overallScore when model degrades scores', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      const highInitialReview: ProfileReview = {
        ...baseReview,
        overallScore: 88,
        scores: {
          searchRelevance: 92,
          humanVoice: 85,
          credibility: 90,
          positioningClarity: 87,
          evidenceCoverage: 86,
        },
      };

      // Model attempts to degrade every single score
      const severelyDegradedModelOutput = {
        targetMarket: 'United States',
        language: 'en',
        overallScore: 40, // < 88
        scores: {
          searchRelevance: 30, // < 92
          humanVoice: 25,      // < 85
          credibility: 45,     // < 90
          positioningClarity: 35, // < 87
          evidenceCoverage: 50, // < 86
        },
        executiveSummary: 'Degraded summary.',
        profileDirection: baseReview.profileDirection,
        critique: [],
        triageBottlenecks: [],
        rewritten: {
          headline: 'Staff Software Engineer | Go, Distributed Systems',
          summary: 'Summary.\n\nStack: Go.',
          experiences: baseProfile.experiences.map((e) => ({
            companyName: e.companyName,
            title: e.title,
            bullets: ['Accomplished X.'],
          })),
          skills: ['Go'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(severelyDegradedModelOutput),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: baseProfile,
        objective: baseObjective,
        confirmedFacts: [],
        initialReview: highInitialReview,
      });

      // Assert each dimension is clamped strictly >= initial score
      expect(analysis.overallScore).toBe(88);
      expect(analysis.scores.searchRelevance).toBe(92);
      expect(analysis.scores.humanVoice).toBe(85);
      expect(analysis.scores.credibility).toBe(90);
      expect(analysis.scores.positioningClarity).toBe(87);
      expect(analysis.scores.evidenceCoverage).toBe(86);
    });

    it('preserves genuinely higher scores from model output while clamping only degraded ones', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      const mixedInitialReview: ProfileReview = {
        ...baseReview,
        overallScore: 70,
        scores: {
          searchRelevance: 85, // LLM will output 95 (should take 95)
          humanVoice: 80,      // LLM will output 65 (should clamp to 80)
          credibility: 75,     // LLM will output 90 (should take 90)
          positioningClarity: 90, // LLM will output 70 (should clamp to 90)
          evidenceCoverage: 60, // LLM will output 85 (should take 85)
        },
      };

      const mixedModelOutput = {
        targetMarket: 'United States',
        language: 'en',
        overallScore: 89, // > 70 (should take 89)
        scores: {
          searchRelevance: 95, // improved
          humanVoice: 65,      // degraded
          credibility: 90,     // improved
          positioningClarity: 70, // degraded
          evidenceCoverage: 85, // improved
        },
        executiveSummary: 'Mixed summary.',
        profileDirection: baseReview.profileDirection,
        critique: [],
        triageBottlenecks: [],
        rewritten: {
          headline: 'Staff Software Engineer | Go',
          summary: 'Summary.\n\nStack: Go.',
          experiences: [
            {
              companyName: 'Stripe',
              title: 'Staff Engineer',
              bullets: ['Delivered systems.'],
            },
          ],
          skills: ['Go'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mixedModelOutput),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: baseProfile,
        objective: baseObjective,
        confirmedFacts: [],
        initialReview: mixedInitialReview,
      });

      expect(analysis.overallScore).toBe(89);
      expect(analysis.scores.searchRelevance).toBe(95);
      expect(analysis.scores.humanVoice).toBe(80); // Clamped
      expect(analysis.scores.credibility).toBe(90);
      expect(analysis.scores.positioningClarity).toBe(90); // Clamped
      expect(analysis.scores.evidenceCoverage).toBe(85);
    });

    it('property-based generator: 200 randomized score vectors satisfy monotonicity inequality', async () => {
      const dimensions = [
        'searchRelevance',
        'humanVoice',
        'credibility',
        'positioningClarity',
        'evidenceCoverage',
      ] as const;

      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      for (let i = 0; i < 200; i++) {
        const randInt = () => Math.floor(Math.random() * 101);

        const initialScores = {
          searchRelevance: randInt(),
          humanVoice: randInt(),
          credibility: randInt(),
          positioningClarity: randInt(),
          evidenceCoverage: randInt(),
        };
        const initialOverall = randInt();

        const modelScores = {
          searchRelevance: randInt(),
          humanVoice: randInt(),
          credibility: randInt(),
          positioningClarity: randInt(),
          evidenceCoverage: randInt(),
        };
        const modelOverall = randInt();

        const testReview: ProfileReview = {
          ...baseReview,
          overallScore: initialOverall,
          scores: initialScores,
        };

        const testModelOutput = {
          targetMarket: 'United States',
          language: 'en',
          overallScore: modelOverall,
          scores: modelScores,
          executiveSummary: 'Summary.',
          profileDirection: baseReview.profileDirection,
          critique: [],
          triageBottlenecks: [],
          rewritten: {
            headline: 'Staff Engineer | Go',
            summary: 'Summary.\n\nGo.',
            experiences: [{ companyName: 'Stripe', title: 'Staff', bullets: ['Bullet'] }],
            skills: ['Go'],
          },
        };

        mockChat.sendMessage.mockResolvedValueOnce({
          text: JSON.stringify(testModelOutput),
        });

        const result = await provider.generateRewrittenProfile({
          profile: baseProfile,
          objective: baseObjective,
          confirmedFacts: [],
          initialReview: testReview,
        });

        // Verification Oracles:
        expect(result.overallScore).toBeGreaterThanOrEqual(initialOverall);
        expect(result.overallScore).toBe(Math.max(modelOverall, initialOverall));

        for (const dim of dimensions) {
          expect(result.scores[dim]).toBeGreaterThanOrEqual(initialScores[dim]);
          expect(result.scores[dim]).toBe(Math.max(modelScores[dim], initialScores[dim]));
        }
      }
    });
  });

  describe('Session History Persistence & Rehydration Cycles', () => {
    it('persists and restores multi-turn chat history across independent provider instances', async () => {
      // Step 1: Provider 1 executes parseAndDiagnose
      const provider1 = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      const initialHistory = [
        {
          role: 'user',
          parts: [{ text: 'Parse and diagnose this candidate profile.' }],
        },
        {
          role: 'model',
          parts: [{ text: JSON.stringify({ profile: baseProfile, review: baseReview }) }],
        },
      ];
      chatHistoryStore = [...initialHistory];

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: baseProfile, review: baseReview }),
      });

      await provider1.parseAndDiagnose({ pdfText: 'Resume text' });

      // Retrieve history from Provider 1
      const savedHistory = provider1.getChatHistory();
      expect(savedHistory).toEqual(initialHistory);

      // Step 2: Provider 2 (simulating page reload F5 / new tab) rehydrates saved history
      const provider2 = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      provider2.restoreChatHistory(savedHistory);

      // Verify Provider 2 re-instantiated chat with the restored history
      expect(mockChats.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          history: initialHistory,
        }),
      );

      // Step 3: Provider 2 executes generateInterview
      const interviewPlan: InterviewPlan = {
        questions: [
          {
            id: 'q1',
            category: 'scale',
            question: 'How did you scale Stripe payment routing?',
            reason: 'Assesses staff scope.',
            placeholderExample: 'e.g. 50k tps',
            relatedExperience: 'Stripe',
            answerType: 'long-text',
            required: true,
          },
        ],
      };

      // Add turn 2 to simulated history store
      const turn2User = { role: 'user', parts: [{ text: 'Interview prompt' }] };
      const turn2Model = { role: 'model', parts: [{ text: JSON.stringify(interviewPlan) }] };
      chatHistoryStore.push(turn2User, turn2Model);

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(interviewPlan),
      });

      const plan = await provider2.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      expect(plan.questions).toHaveLength(1);

      // Retrieve history from Provider 2
      const historyAfterTurn2 = provider2.getChatHistory();
      expect(historyAfterTurn2).toHaveLength(4);

      // Step 4: Provider 3 rehydrates Turn 2 history and executes evaluateProgress
      const provider3 = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      provider3.restoreChatHistory(historyAfterTurn2);

      const progressOutput = {
        readyForGeneration: true,
        rationale: 'Metrics clear.',
        questions: [],
        facts: [
          {
            id: 'f-stripe',
            statement: 'Engineered Stripe payment routing for 50k tps.',
            source: 'interview',
            sourceReference: 'Stripe',
            confirmed: true,
          },
        ],
      };

      const turn3User = { role: 'user', parts: [{ text: 'Progress prompt' }] };
      const turn3Model = { role: 'model', parts: [{ text: JSON.stringify(progressOutput) }] };
      chatHistoryStore.push(turn3User, turn3Model);

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(progressOutput),
      });

      const progress = await provider3.evaluateProgress({
        profile: baseProfile,
        objective: baseObjective,
        plan,
        answers: [{ questionId: 'q1', value: '50k tps', skipped: false }],
        previousFacts: [],
      });

      expect(progress.readyForGeneration).toBe(true);
      expect(provider3.getChatHistory()).toHaveLength(6);
    });

    it('survives JSON serialization and deserialization cycle (localStorage fidelity)', async () => {
      const provider1 = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      const rawHistory = [
        {
          role: 'user',
          parts: [{ text: 'Initial diagnosis' }, { inlineData: { mimeType: 'application/pdf', data: 'JVBERi0=' } }],
        },
        {
          role: 'model',
          parts: [{ text: '{"status":"diagnosed"}' }],
        },
      ];

      chatHistoryStore = [...rawHistory];
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: baseProfile, review: baseReview }),
      });
      await provider1.parseAndDiagnose({ pdfText: 'Test text' });

      // Simulate JSON serialization to localStorage:
      const serialized = JSON.stringify(provider1.getChatHistory());
      expect(typeof serialized).toBe('string');

      // Simulate deserialization from localStorage on next session:
      const parsed = JSON.parse(serialized);

      const provider2 = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      provider2.restoreChatHistory(parsed);

      expect(mockChats.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          history: rawHistory,
        }),
      );

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ questions: [] }),
      });

      const plan = await provider2.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      expect(plan.questions).toEqual([]);
    });

    it('defensively handles invalid or non-array history restore inputs without throwing', () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        retryDelayMs: 0,
      });

      expect(() => provider.restoreChatHistory(null as any)).not.toThrow();
      expect(() => provider.restoreChatHistory(undefined as any)).not.toThrow();
      expect(() => provider.restoreChatHistory('not-an-array' as any)).not.toThrow();
      expect(() => provider.restoreChatHistory({} as any)).not.toThrow();
      expect(() => provider.restoreChatHistory(123 as any)).not.toThrow();
    });

    it('preserves pristine history across transient 503 fallback and transfers it to contingency chat', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-key',
        model: 'gemini-3.5-flash',
        retryDelayMs: 0,
      });

      const priorHistory = [
        { role: 'user', parts: [{ text: 'Prior turn prompt' }] },
        { role: 'model', parts: [{ text: 'Prior turn output' }] },
      ];
      chatHistoryStore = [...priorHistory];

      const transientError = new Error('503 Service Unavailable');
      (transientError as any).status = 503;

      // 3 attempts fail on gemini-3.5-flash, then fallback to gemini-3.6-flash succeeds
      mockChat.sendMessage
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({
          text: JSON.stringify({ questions: [] }),
        });

      await provider.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      // Contingency chat MUST have received the priorHistory intact
      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.6-flash',
          history: priorHistory,
        }),
      );
      expect(provider.getModel()).toBe('gemini-3.6-flash');
    });
  });
});
