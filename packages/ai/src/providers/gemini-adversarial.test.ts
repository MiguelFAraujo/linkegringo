import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  ParseAndDiagnoseInput,
  Profile,
  ProfileReview,
} from '@linkegringo/core';
import {
  cleanBase64,
  enforceExperienceRecovery,
  GeminiAiProvider,
  getFallbackModels,
  isAuthError,
  isTransientOrHighDemandError,
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

describe('GeminiAiProvider Adversarial Harness', () => {
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
    publicId: 'adversarial-candidate',
    firstName: 'Beatriz',
    lastName: 'Lima',
    headline: 'Principal Engineer | Distributed Systems | Go, Rust',
    location: 'Belo Horizonte, Brazil',
    summary: 'Lead architect specialized in high throughput systems.',
    experiences: [
      {
        title: 'Principal Engineer',
        companyName: 'CloudScale Inc',
        current: true,
        dateRangeText: '2021 - Present',
        description: 'Architected distributed multi-region database engine.\nHandled 1M+ write requests per second.',
      },
      {
        title: 'Staff Engineer',
        companyName: 'Alpha Fintech',
        current: false,
        dateRangeText: '2018 - 2021',
        description: 'Designed payment ledger with strict ACID compliance.',
      },
      {
        title: 'Backend Engineer',
        companyName: 'Legacy Systems SA',
        current: false,
        dateRangeText: '2015 - 2018',
        description: 'Built distributed message queue in C++.',
      },
    ],
    education: [
      {
        schoolName: 'UFMG',
        degreeName: 'Master of Science',
        fieldOfStudy: 'Computer Science',
      },
    ],
    skills: [{ name: 'Go' }, { name: 'Rust' }, { name: 'Distributed Systems' }],
    certifications: [],
    projects: [],
    languages: [{ name: 'English', proficiency: 'Native / Bilingual' }],
    honors: [],
  };

  const baseReview: ProfileReview = {
    targetMarket: 'United States',
    language: 'en',
    overallScore: 78,
    scores: {
      searchRelevance: 82,
      humanVoice: 75,
      credibility: 85,
      positioningClarity: 80,
      evidenceCoverage: 70,
    },
    scoreExplanations: {
      searchRelevance: 'Strong keyword presence in distributed systems.',
      humanVoice: 'Direct engineering terminology.',
      credibility: 'High level architectural impact evidenced.',
      positioningClarity: 'Clear Principal Engineer anchor.',
      evidenceCoverage: 'Good metrics, could expand financial efficiency.',
    },
    executiveSummary: 'Perfil sênior de alto valor com forte alinhamento técnico.',
    profileDirection: {
      positioning: 'Principal Distributed Systems Architect',
      primaryRole: 'Principal Engineer',
      alternativeRoles: ['Staff Software Engineer', 'VP of Engineering'],
      rationale: 'Experiência robusta em infraestrutura crítica.',
    },
    critique: [],
    triageBottlenecks: [
      'Ausência de métricas de custo de infraestrutura (cloud spend savings).',
    ],
  };

  const baseObjective: CareerObjective = {
    primaryRole: 'Principal Engineer',
    targetMarket: 'United States',
    workPreference: 'remote',
    excludedTechnologies: ['PHP', 'COBOL'],
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
        if (Array.isArray(params?.history)) {
          chatHistoryStore = [...params.history];
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

  describe('1. Adversarial Base64 & PDF Part Sanitization', () => {
    it('handles heavy multiline whitespace, tabs, and Windows CRLF within base64 strings', () => {
      const hostileDataUrl =
        'data:application/pdf;base64,\r\n  JVBERi0xLjQK  \t\n  MSAwIG9iago=  \r\n\r\n';
      const cleaned = cleanBase64(hostileDataUrl);
      expect(cleaned).toBe('JVBERi0xLjQKMSAwIG9iago=');
      expect(cleaned).not.toMatch(/\s/);
    });

    it('handles huge base64 payload (100k characters) without ReDoS or stack explosion', () => {
      const chunk = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const repeated = chunk.repeat(1600); // 102,400 chars
      const payload = `data:application/pdf;base64,${repeated}`;
      const start = Date.now();
      const cleaned = cleanBase64(payload);
      const elapsed = Date.now() - start;
      expect(cleaned).toBe(repeated);
      expect(elapsed).toBeLessThan(100); // Under 100ms
    });

    it('safely handles non-string or corrupted inputs to cleanBase64', () => {
      expect(cleanBase64(null as any)).toBe('');
      expect(cleanBase64(undefined as any)).toBe('');
      expect(cleanBase64({} as any)).toBe('');
      expect(cleanBase64(12345 as any)).toBe('');
      expect(cleanBase64('')).toBe('');
      expect(cleanBase64('   ')).toBe('');
    });

    it('strips octet-stream base64 data URIs correctly', () => {
      const octetStreamUri = 'data:application/octet-stream;base64,JVBERi0xLjQK';
      expect(cleanBase64(octetStreamUri)).toBe('JVBERi0xLjQK');
    });

    it('preserves raw base64 that does not contain commas or data URI prefixes', () => {
      const raw = 'SGkgdGhpcyBpcyBhIHJhdyBiYXNlNjQgc3RyaW5n';
      expect(cleanBase64(raw)).toBe(raw);
    });
  });

  describe('2. Multi-turn Conversational Pipeline Stress', () => {
    it('executes full end-to-end 4-turn pipeline preserving session chat across all turns', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'adversarial-key',
        retryDelayMs: 0,
      });

      // Turn 1: parseAndDiagnose
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: baseProfile, review: baseReview }),
      });
      const t1Result = await provider.parseAndDiagnose({
        pdfBase64: 'data:application/pdf;base64,JVBERi0xLjQK',
        targetRole: 'Principal Engineer',
      });
      expect(t1Result.profile.firstName).toBe('Beatriz');
      expect(mockChats.create).toHaveBeenCalledTimes(1);

      // Turn 2: generateInterview
      const mockInterview: InterviewPlan = {
        questions: [
          {
            id: 'q-perf',
            category: 'scale',
            question: 'How did you scale the distributed database to 1M writes/s?',
            reason: 'Validates Principal level engineering metrics.',
            placeholderExample: 'Ex: Sharding and zero-copy ring buffers.',
            relatedExperience: 'CloudScale Inc',
            answerType: 'long-text',
            required: true,
          },
        ],
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockInterview),
      });
      const t2Result = await provider.generateInterview({
        profile: t1Result.profile,
        objective: baseObjective,
        review: t1Result.review,
      });
      expect(t2Result.questions).toHaveLength(1);
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(2);

      // Turn 3: evaluateProgress (Round 1)
      const answers: InterviewAnswer[] = [
        {
          questionId: 'q-perf',
          value: 'We utilized consistent hashing and userspace memory mapping.',
          skipped: false,
        },
      ];
      const mockProgress = {
        readyForGeneration: true,
        rationale: 'High signal response provided.',
        questions: [],
        facts: [
          {
            id: 'fact-1',
            statement: 'Architected consistent hashing layer supporting 1M writes/sec with sub-millisecond p99.',
            source: 'interview' as const,
            sourceReference: 'Entrevista: Escala CloudScale Inc',
            confirmed: true,
          },
        ],
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockProgress),
      });
      const t3Result = await provider.evaluateProgress({
        profile: t1Result.profile,
        objective: baseObjective,
        plan: t2Result,
        answers,
        previousFacts: [],
        roundNumber: 1,
      });
      expect(t3Result.readyForGeneration).toBe(true);
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(3);

      // Turn 4: generateRewrittenProfile
      const mockRewrittenOutput = {
        targetMarket: 'United States',
        language: 'en',
        initialScore: 78,
        overallScore: 96,
        scores: {
          searchRelevance: 97,
          humanVoice: 95,
          credibility: 98,
          positioningClarity: 96,
          evidenceCoverage: 95,
        },
        executiveSummary: 'Executive trajectory summary.',
        profileDirection: baseReview.profileDirection,
        critique: [],
        triageBottlenecks: baseReview.triageBottlenecks,
        rewritten: {
          headline: 'Principal Engineer | Go, Rust, Distributed Systems | High-Throughput DBs',
          summary: 'Principal Systems Architect with 10+ years scaling core engines.\n\nCore Technologies: Go, Rust.',
          experiences: [
            {
              title: 'Principal Engineer',
              companyName: 'CloudScale Inc',
              bullets: [
                'Accomplished 1M+ write requests per second, measured by sub-ms latency, by architecting consistent hashing engine.',
              ],
            },
            {
              title: 'Staff Engineer',
              companyName: 'Alpha Fintech',
              bullets: ['Delivered zero-loss payment ledger.'],
            },
            {
              title: 'Backend Engineer',
              companyName: 'Legacy Systems SA',
              bullets: ['Constructed C++ message broker.'],
            },
          ],
          skills: ['Go', 'Rust', 'Distributed Systems'],
        },
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockRewrittenOutput),
      });
      const t4Result = await provider.generateRewrittenProfile({
        profile: t1Result.profile,
        objective: baseObjective,
        confirmedFacts: t3Result.facts,
        initialReview: t1Result.review,
      });

      expect(t4Result.overallScore).toBe(96);
      expect(t4Result.rewritten.experiences).toHaveLength(3);
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(4);
    });

    it('simulates browser reload (F5) by saving history and restoring into a fresh provider instance', async () => {
      // Instance A
      const providerA = new GeminiAiProvider({
        apiKey: 'reload-test-key',
        retryDelayMs: 0,
      });

      const sampleHistory = [
        { role: 'user', parts: [{ text: 'User PDF submission' }] },
        { role: 'model', parts: [{ text: '{"profile": {}, "review": {}}' }] },
      ];
      mockChat.getHistory.mockReturnValue(sampleHistory);

      // Simulate Turn 1
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: baseProfile, review: baseReview }),
      });
      await providerA.parseAndDiagnose({ pdfText: 'Resume' });

      // Save state to simulate localStorage serialization
      const serialized = JSON.stringify(providerA.getChatHistory());

      // Instance B (post-reload)
      const providerB = new GeminiAiProvider({
        apiKey: 'reload-test-key',
        retryDelayMs: 0,
      });

      const parsedHistory = JSON.parse(serialized);
      providerB.restoreChatHistory(parsedHistory);

      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          history: sampleHistory,
        }),
      );

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ questions: [] }),
      });

      await providerB.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      expect(mockChat.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Fallback, Retry, and Resilience Harness', () => {
    it('exhausts primary model and successfully migrates through secondary fallback without losing history', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'fallback-test-key',
        model: 'gemini-3.5-flash',
        retryDelayMs: 0,
      });

      const priorHistory = [
        { role: 'user', parts: [{ text: 'Prior turn prompt' }] },
        { role: 'model', parts: [{ text: 'Prior turn response' }] },
      ];
      chatHistoryStore = [...priorHistory];

      // Primary model (gemini-3.5-flash) fails 3 times (attempt 0, 1, 2)
      const err503 = new Error('503 Service Unavailable: overloaded');
      (err503 as any).status = 503;

      mockChat.sendMessage
        .mockRejectedValueOnce(err503)
        .mockRejectedValueOnce(err503)
        .mockRejectedValueOnce(err503)
        // Fallback model (gemini-3.6-flash) also fails once with 429
        .mockRejectedValueOnce({ status: 429, message: 'Resource has been exhausted (rate limit)' })
        // Fallback model then succeeds on attempt 1
        .mockResolvedValueOnce({
          text: JSON.stringify({ questions: [] }),
        });

      const plan = await provider.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      expect(plan.questions).toEqual([]);
      expect(provider.getModel()).toBe('gemini-3.6-flash');
      // Verify mockChats.create was called for candidate migration with the uncorrupted prior history
      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.6-flash',
          history: priorHistory,
        }),
      );
    });

    it('immediately skips deprecated models returning 404 Not Found without wasting retries', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'deprecated-test-key',
        model: 'gemini-3.5-flash',
        retryDelayMs: 0,
      });

      const err404 = new Error('404 Not Found: models/gemini-3.5-flash is no longer available');
      (err404 as any).status = 404;

      // Model 3.5 immediately fails with 404 (only 1 attempt, no retries)
      mockChat.sendMessage
        .mockRejectedValueOnce(err404)
        // Model 3.6 succeeds immediately
        .mockResolvedValueOnce({
          text: JSON.stringify({ questions: [] }),
        });

      const plan = await provider.generateInterview({
        profile: baseProfile,
        objective: baseObjective,
      });

      expect(plan.questions).toEqual([]);
      expect(provider.getModel()).toBe('gemini-3.6-flash');
      // Only 2 sendMessage calls: 1 for 3.5 (no retry), 1 for 3.6
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('throws immediately on non-transient errors (e.g. 400 Bad Request) without retrying or model switching', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'non-transient-key',
        retryDelayMs: 0,
      });

      const badRequest = new Error('400 Bad Request: Invalid JSON Schema parameter');
      (badRequest as any).status = 400;

      mockChat.sendMessage.mockRejectedValueOnce(badRequest);

      await expect(
        provider.generateInterview({
          profile: baseProfile,
          objective: baseObjective,
        }),
      ).rejects.toThrow('400 Bad Request');

      expect(mockChat.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('throws comprehensive error when all fallback models fail', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'all-fail-key',
        model: 'gemini-3.5-flash',
        retryDelayMs: 0,
      });

      const err503 = new Error('503 Service Unavailable');
      (err503 as any).status = 503;

      mockChat.sendMessage.mockRejectedValue(err503);

      await expect(
        provider.generateInterview({
          profile: baseProfile,
          objective: baseObjective,
        }),
      ).rejects.toThrow('Os servidores do Google Gemini estão sob alta demanda temporária (erro 503/429)');
    });

    it('evaluates transient error helper correctly across error message variations', () => {
      expect(isTransientOrHighDemandError({ status: 503 })).toBe(true);
      expect(isTransientOrHighDemandError({ status: 429 })).toBe(true);
      expect(isTransientOrHighDemandError({ code: 503 })).toBe(true);
      expect(isTransientOrHighDemandError({ error: { code: 429 } })).toBe(true);
      expect(isTransientOrHighDemandError(new Error('Resource has been exhausted: quota exceeded'))).toBe(true);
      expect(isTransientOrHighDemandError(new Error('Model is temporarily overloaded due to spikes in demand'))).toBe(true);
      expect(isTransientOrHighDemandError(new Error('Server unavailable'))).toBe(true);
      expect(isTransientOrHighDemandError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isTransientOrHighDemandError(new Error('400 Bad Request'))).toBe(false);
      expect(isTransientOrHighDemandError(new Error('401 Unauthorized'))).toBe(false);
      expect(isTransientOrHighDemandError(null)).toBe(false);
    });

    it('evaluates auth error helper correctly', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ status: 403 })).toBe(true);
      expect(isAuthError(new Error('API key not valid'))).toBe(true);
      expect(isAuthError(new Error('PERMISSION_DENIED'))).toBe(true);
      expect(isAuthError({ status: 503 })).toBe(false);
      expect(isAuthError(null)).toBe(false);
    });
  });

  describe('4. Invariant N -> N & Score Monotonicity Stress Harness', () => {
    it('restores all original companies when model returns 0 experiences (complete omission)', () => {
      const original = [
        { companyName: 'Company A', title: 'Architect', description: 'Built A' },
        { companyName: 'Company B', title: 'Lead', description: 'Built B' },
        { companyName: 'Company C', title: 'Dev', description: 'Built C' },
      ];
      const rewritten: Array<{ companyName: string; title: string; bullets: string[] }> = [];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(3);
      expect(recovered.map((r) => r.companyName)).toEqual(['Company A', 'Company B', 'Company C']);
      expect(recovered[0].title).toBe('Architect');
      expect(recovered[0].bullets).toContain('Built A');
    });

    it('matches companies case-insensitively with leading/trailing whitespace without producing duplicates', () => {
      const original = [
        { companyName: '   Stripe Payments   ', title: 'Staff Engineer' },
        { companyName: 'Airbnb Inc', title: 'Senior Engineer' },
      ];
      const rewritten = [
        {
          companyName: 'stripe payments',
          title: 'Principal Engineer',
          bullets: ['Redesigned global settlement pipeline.'],
        },
      ];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(2);
      expect(recovered[0].companyName).toBe('stripe payments');
      expect(recovered[1].companyName).toBe('Airbnb Inc');
    });

    it('handles empty company names or nulls in original experiences gracefully', () => {
      const original = [
        { companyName: '', title: 'Ghost Co' },
        { companyName: '   ', title: 'Blank Co' },
        null as any,
        { companyName: 'Real Co', title: 'Real Engineer', description: 'Solid track record' },
      ];
      const rewritten: Array<{ companyName: string; title: string; bullets: string[] }> = [];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(1);
      expect(recovered[0].companyName).toBe('Real Co');
    });

    it('preserves initial triageBottlenecks if rewritten response leaves it empty', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'triage-preservation-key',
        retryDelayMs: 0,
      });

      const rewrittenWithoutBottlenecks = {
        targetMarket: 'United States',
        language: 'en',
        initialScore: 78,
        overallScore: 92,
        scores: {
          searchRelevance: 90,
          humanVoice: 90,
          credibility: 90,
          positioningClarity: 90,
          evidenceCoverage: 90,
        },
        executiveSummary: 'Summary.',
        profileDirection: baseReview.profileDirection,
        critique: [],
        triageBottlenecks: [], // Model forgot triage bottlenecks
        rewritten: {
          headline: 'Principal Engineer | Go, Rust',
          summary: 'Summary with paragraphs.\n\nStack: Go.',
          experiences: [
            {
              title: 'Principal Engineer',
              companyName: 'CloudScale Inc',
              bullets: ['Accomplished scale.'],
            },
            {
              title: 'Staff Engineer',
              companyName: 'Alpha Fintech',
              bullets: ['Accomplished ledger.'],
            },
            {
              title: 'Backend Engineer',
              companyName: 'Legacy Systems SA',
              bullets: ['Accomplished queue.'],
            },
          ],
          skills: ['Go', 'Rust'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(rewrittenWithoutBottlenecks),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: baseProfile,
        objective: baseObjective,
        confirmedFacts: [],
        initialReview: baseReview, // Has 'Ausência de métricas de custo de infraestrutura...'
      });

      expect(analysis.triageBottlenecks).toHaveLength(1);
      expect(analysis.triageBottlenecks[0]).toContain('Ausência de métricas de custo de infraestrutura');
    });
  });
});
