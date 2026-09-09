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
} from './gemini.js';
import { geminiParseAndDiagnoseSchema } from '../schemas.js';
import { PARSE_AND_DIAGNOSE_SYSTEM_PROMPT } from '../prompts.js';

// Retain actual GenAI schema types while mocking the API client class
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: vi.fn(),
  };
});

import { GoogleGenAI } from '@google/genai';

describe('GeminiAiProvider', () => {
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

  const sampleProfile: Profile = {
    publicId: 'alexandre-rocha',
    firstName: 'Alexandre',
    lastName: 'Rocha',
    headline: 'Senior Backend Engineer | Java | Distributed Systems',
    location: 'São Paulo, Brazil',
    summary: 'Senior software engineer with 7+ years of experience in distributed systems.',
    experiences: [
      {
        title: 'Senior Software Engineer',
        companyName: 'Fintech Pagamentos',
        current: true,
        dateRangeText: '2022 - Present',
        description: 'Architected Kafka pipelines processing 20M events daily.\nReduced p99 latency by 35%.',
      },
      {
        title: 'Software Engineer',
        companyName: 'Varejo Digital',
        current: false,
        dateRangeText: '2019 - 2022',
        description: 'Engineered checkout APIs with 99.99% availability.',
      },
      {
        title: 'Software Developer',
        companyName: 'Startup Antiga',
        current: false,
        dateRangeText: '2017 - 2019',
        description: 'Built REST APIs using Java and Spring Boot.',
      },
    ],
    education: [
      {
        schoolName: 'USP',
        degreeName: 'Bachelor',
        fieldOfStudy: 'Computer Science',
      },
    ],
    skills: [{ name: 'Java' }, { name: 'Spring Boot' }, { name: 'Kafka' }],
    certifications: [],
    projects: [],
    languages: [{ name: 'English', proficiency: 'Fluent' }],
    honors: [],
  };

  const sampleReview: ProfileReview = {
    targetMarket: 'United States',
    language: 'en',
    overallScore: 55,
    scores: {
      searchRelevance: 55,
      humanVoice: 60,
      credibility: 50,
      positioningClarity: 55,
      evidenceCoverage: 55,
    },
    scoreExplanations: {
      searchRelevance: 'Good keywords but needs US ATS targeting.',
      humanVoice: 'Clear English tone.',
      credibility: 'Solid engineering trajectory.',
      positioningClarity: 'Clear backend positioning.',
      evidenceCoverage: 'Good metrics present.',
    },
    executiveSummary: 'Perfil sólido com bom potencial para o mercado dos EUA.',
    profileDirection: {
      positioning: 'Senior Distributed Systems Engineer',
      primaryRole: 'Senior Backend Engineer',
      alternativeRoles: ['Systems Engineer'],
      rationale: 'Forte background em mensageria e resiliência.',
    },
    critique: [
      {
        section: 'Headline',
        assessment: 'Headline de alto sinal.',
        strengths: ['Contém stack e escopo'],
        issues: [],
        severity: 'low',
      },
    ],
    triageBottlenecks: [
      'Ausência de métricas financeiras quantificadas em dólares nas experiências mais recentes.',
    ],
  };

  const sampleObjective: CareerObjective = {
    primaryRole: 'Senior Backend Engineer',
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

  describe('cleanBase64 helper', () => {
    it('strips data URL scheme prefix and whitespace', () => {
      const input = 'data:application/pdf;base64,  JVBERi0xLjQK   \n\r\t';
      expect(cleanBase64(input)).toBe('JVBERi0xLjQK');
    });

    it('returns clean base64 string unchanged', () => {
      expect(cleanBase64('JVBERi0xLjQK')).toBe('JVBERi0xLjQK');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(cleanBase64('')).toBe('');
      expect(cleanBase64(undefined)).toBe('');
    });
  });

  describe('enforceExperienceRecovery invariant helper', () => {
    it('recovers missing original companies without losing historical trajectory', () => {
      const original = [
        { companyName: 'Fintech Pagamentos', title: 'Senior Engineer', description: 'Kafka & Spring' },
        { companyName: 'Varejo Digital', title: 'Software Engineer', description: 'Checkout systems' },
        { companyName: 'Startup Antiga', title: 'Junior Dev', description: 'Maintained legacy APIs' },
      ];

      const rewritten = [
        {
          companyName: 'Fintech Pagamentos',
          title: 'Senior Distributed Systems Engineer',
          bullets: ['Architected Kafka pipelines processing 20M events daily.'],
        },
      ];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(3);
      expect(recovered[0].companyName).toBe('Fintech Pagamentos');
      expect(recovered[1].companyName).toBe('Varejo Digital');
      expect(recovered[2].companyName).toBe('Startup Antiga');
      expect(recovered[1].bullets).toContain('Checkout systems');
      expect(recovered[2].bullets).toContain('Maintained legacy APIs');
    });

    it('does not duplicate existing companies regardless of case or whitespace', () => {
      const original = [
        { companyName: '  Fintech Pagamentos  ', title: 'Senior Engineer' },
      ];
      const rewritten = [
        {
          companyName: 'fintech pagamentos',
          title: 'Lead Engineer',
          bullets: ['Delivered core platform initiatives.'],
        },
      ];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(1);
      expect(recovered[0].title).toBe('Lead Engineer');
    });

    it('handles empty description with meaningful fallback bullet', () => {
      const original = [{ companyName: 'Early Stage Co', title: 'Developer' }];
      const rewritten: Array<{ companyName: string; title: string; bullets: string[] }> = [];

      const recovered = enforceExperienceRecovery(original, rewritten);
      expect(recovered).toHaveLength(1);
      expect(recovered[0].companyName).toBe('Early Stage Co');
      expect(recovered[0].bullets[0]).toContain('Early Stage Co');
    });
  });

  describe('parseAndDiagnose', () => {
    it('initializes chat session with thinkingBudget: 2048 and multimodal inlineData PDF', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      const mockResponseText = JSON.stringify({
        reasoning: {
          physicalInventory: { companyCountN: 3, companiesEnumerated: ['Fintech Pagamentos', 'Varejo Digital', 'Startup Antiga'] },
        },
        profile: sampleProfile,
        review: sampleReview,
      });

      mockChat.sendMessage.mockResolvedValueOnce({
        text: mockResponseText,
      });

      const input: ParseAndDiagnoseInput = {
        pdfBase64: 'data:application/pdf;base64,JVBERi0xLjQK',
        cvPdfBase64: 'data:application/pdf;base64,Q1ZQREY=',
        targetRole: 'Senior Backend Engineer',
      };

      const result = await provider.parseAndDiagnose(input);

      // Verify chat was initialized via ai.chats.create
      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.5-flash',
          history: [],
          config: expect.objectContaining({
            temperature: 0.1,
            responseSchema: geminiParseAndDiagnoseSchema,
            responseMimeType: 'application/json',
            systemInstruction: PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
            thinkingConfig: { thinkingBudget: 2048 },
          }),
        }),
      );

      // Verify multimodal message parts passed to chat.sendMessage
      expect(mockChat.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.arrayContaining([
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: 'JVBERi0xLjQK',
              },
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: 'Q1ZQREY=',
              },
            },
            expect.objectContaining({
              text: expect.stringContaining('Senior Backend Engineer'),
            }),
          ]),
        }),
      );

      // Verify parsed output
      expect(result.profile.firstName).toBe('Alexandre');
      expect(result.profile.experiences).toHaveLength(3);
      expect(result.review.overallScore).toBe(55);
      expect(result.review.triageBottlenecks).toHaveLength(1);
    });

    it('scrubs emojis and false benchmarks from diagnostic output', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      const profileWithEmoji = {
        ...sampleProfile,
        headline: 'Senior Engineer 🚀 | Top 1% dos candidatos',
      };

      const reviewWithEmoji = {
        ...sampleReview,
        executiveSummary: 'Perfil top 5% dos candidatos! 🌟 Um dos melhores resumos já vistos.',
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({
          profile: profileWithEmoji,
          review: reviewWithEmoji,
        }),
      });

      const result = await provider.parseAndDiagnose({
        pdfText: 'Alexandre Rocha resume',
      });

      expect(result.profile.headline).not.toContain('🚀');
      expect(result.review.executiveSummary).not.toContain('🌟');
      expect(result.review.executiveSummary).not.toContain('top 5%');
      expect(result.review.executiveSummary).not.toContain('um dos melhores resumos');
    });
  });

  describe('Multi-turn conversational memory', () => {
    it('executes generateInterview, evaluateProgress, and generateRewrittenProfile through active chat session', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      // Turn 1: parseAndDiagnose
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: sampleProfile, review: sampleReview }),
      });
      await provider.parseAndDiagnose({ pdfText: 'Candidate info' });
      expect(mockChats.create).toHaveBeenCalledTimes(1);

      // Turn 2: generateInterview
      const mockPlan: InterviewPlan = {
        questions: [
          {
            id: 'kafka-scale',
            category: 'scale',
            question: 'What was the peak throughput of your Kafka cluster?',
            reason: 'Critério dos recrutadores dos EUA: Valida experiência em alta volumetria.',
            placeholderExample: 'Ex: 25M eventos por dia com latência p99 de 120ms.',
            relatedExperience: 'Fintech Pagamentos',
            answerType: 'long-text',
            required: true,
          },
        ],
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockPlan),
      });

      const plan = await provider.generateInterview({
        profile: sampleProfile,
        objective: sampleObjective,
        review: sampleReview,
      });
      expect(plan.questions).toHaveLength(1);
      expect(plan.questions[0].id).toBe('kafka-scale');

      // Turn 3: evaluateProgress
      const answers: InterviewAnswer[] = [
        {
          questionId: 'kafka-scale',
          value: 'We processed 20M events daily with sub-100ms p99 latency.',
          skipped: false,
        },
      ];
      const previousFacts: ConfirmedFact[] = [];
      const mockProgress = {
        readyForGeneration: true,
        rationale: 'Candidate provided sufficient engineering metrics.',
        questions: [],
        facts: [
          {
            id: 'f1',
            statement: 'Architected event-driven microservices processing 20M events/day.',
            source: 'interview' as const,
            sourceReference: 'Entrevista: Escala Kafka',
            confirmed: false,
          },
        ],
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockProgress),
      });

      const progress = await provider.evaluateProgress({
        profile: sampleProfile,
        objective: sampleObjective,
        plan,
        answers,
        previousFacts,
      });
      expect(progress.readyForGeneration).toBe(true);
      expect(progress.facts).toHaveLength(1);

      // Turn 4: generateRewrittenProfile
      const mockAnalysis = {
        targetMarket: 'United States',
        language: 'en',
        initialScore: 55,
        overallScore: 95,
        scores: {
          searchRelevance: 96,
          humanVoice: 94,
          credibility: 95,
          positioningClarity: 96,
          evidenceCoverage: 95,
        },
        executiveSummary: 'Executive profile transformation.',
        profileDirection: sampleReview.profileDirection,
        critique: [],
        triageBottlenecks: sampleReview.triageBottlenecks,
        rewritten: {
          headline: 'Senior Backend Engineer | Java, Spring Boot, Kafka | Distributed Systems | AWS',
          summary: 'Senior Backend Engineer with 7+ years of experience.\n\nCore Technologies: Java, Kafka.',
          experiences: [
            {
              title: 'Senior Software Engineer',
              companyName: 'Fintech Pagamentos',
              bullets: ['Accomplished 20M daily events processing, measured by sub-100ms p99, by tuning Kafka.'],
            },
            {
              title: 'Software Engineer',
              companyName: 'Varejo Digital',
              bullets: ['Delivered checkout services with 99.99% uptime.'],
            },
            {
              title: 'Software Developer',
              companyName: 'Startup Antiga',
              bullets: ['Developed RESTful microservices.'],
            },
          ],
          skills: ['Java', 'Kafka', 'Spring Boot'],
        },
      };
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(mockAnalysis),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: sampleProfile,
        objective: sampleObjective,
        confirmedFacts: [{ ...mockProgress.facts[0], confirmed: true }],
        initialReview: sampleReview,
      });

      expect(analysis.overallScore).toBe(95);
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(4);
    });

    it('gracefully creates a chat session when called standalone without parseAndDiagnose', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ questions: [] }),
      });

      const plan = await provider.generateInterview({
        profile: sampleProfile,
        objective: sampleObjective,
      });

      expect(mockChats.create).toHaveBeenCalledTimes(1);
      expect(plan.questions).toEqual([]);
    });
  });

  describe('Session persistence (getChatHistory & restoreChatHistory)', () => {
    it('exposes active chat history via getChatHistory', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      const fakeHistory = [
        { role: 'user', parts: [{ text: 'Turn 1' }] },
        { role: 'model', parts: [{ text: 'Response 1' }] },
      ];
      mockChat.getHistory.mockReturnValue(fakeHistory);

      // Trigger chat initialization
      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ profile: sampleProfile, review: sampleReview }),
      });
      await provider.parseAndDiagnose({ pdfText: 'Test' });

      const history = provider.getChatHistory();
      expect(history).toEqual(fakeHistory);
    });

    it('restores chat history and continues conversational sequence', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      const previousHistory = [
        { role: 'user', parts: [{ text: 'Diagnose profile' }] },
        { role: 'model', parts: [{ text: 'Diagnostic result' }] },
      ];

      provider.restoreChatHistory(previousHistory);

      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          history: previousHistory,
        }),
      );

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify({ questions: [] }),
      });

      await provider.generateInterview({
        profile: sampleProfile,
        objective: sampleObjective,
      });

      expect(mockChat.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Non-regression guards: Invariant N -> N & Score Monotonicity', () => {
    it('recovers omitted company from candidate profile during rewrite (Invariant N -> N)', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      // Model output drops 'Startup Antiga'
      const rewrittenMissingCompany = {
        targetMarket: 'United States',
        language: 'en',
        initialScore: 55,
        overallScore: 92,
        scores: {
          searchRelevance: 95,
          humanVoice: 92,
          credibility: 90,
          positioningClarity: 94,
          evidenceCoverage: 91,
        },
        executiveSummary: 'Transformação.',
        profileDirection: sampleReview.profileDirection,
        critique: [],
        triageBottlenecks: sampleReview.triageBottlenecks,
        rewritten: {
          headline: 'Senior Backend Engineer | Java, Kafka',
          summary: 'Summary with double line breaks.\n\nCore Stack: Java.',
          experiences: [
            {
              title: 'Senior Software Engineer',
              companyName: 'Fintech Pagamentos',
              bullets: ['Accomplished p99 reduction by 35% using Kafka.'],
            },
            {
              title: 'Software Engineer',
              companyName: 'Varejo Digital',
              bullets: ['Delivered checkout services.'],
            },
            // Note: 'Startup Antiga' was omitted by the LLM
          ],
          skills: ['Java', 'Kafka'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(rewrittenMissingCompany),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: sampleProfile, // Contains 3 experiences
        objective: sampleObjective,
        confirmedFacts: [],
        initialReview: sampleReview,
      });

      // Verify that all 3 companies exist in the final rewritten output
      expect(analysis.rewritten.experiences).toHaveLength(3);
      const companyNames = analysis.rewritten.experiences.map((e) => e.companyName);
      expect(companyNames).toContain('Fintech Pagamentos');
      expect(companyNames).toContain('Varejo Digital');
      expect(companyNames).toContain('Startup Antiga');
    });

    it('enforces score monotonicity when model outputs lower scores than initial review', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        retryDelayMs: 0,
      });

      const eliteReview: ProfileReview = {
        ...sampleReview,
        overallScore: 91,
        scores: {
          searchRelevance: 92,
          humanVoice: 90,
          credibility: 95,
          positioningClarity: 90,
          evidenceCoverage: 88,
        },
      };

      // Model returns lower scores
      const degradedModelOutput = {
        targetMarket: 'United States',
        language: 'en',
        overallScore: 85, // Lower than 91
        scores: {
          searchRelevance: 80, // Lower than 92
          humanVoice: 85, // Lower than 90
          credibility: 88, // Lower than 95
          positioningClarity: 85, // Lower than 90
          evidenceCoverage: 90, // Higher than 88 (should keep 90)
        },
        executiveSummary: 'Summary.',
        profileDirection: sampleReview.profileDirection,
        critique: [],
        triageBottlenecks: [],
        rewritten: {
          headline: 'Senior Backend Engineer | Java',
          summary: 'Summary.\n\nStack: Java.',
          experiences: [
            {
              title: 'Senior Engineer',
              companyName: 'Fintech Pagamentos',
              bullets: ['Delivered Kafka systems.'],
            },
            {
              title: 'Software Engineer',
              companyName: 'Varejo Digital',
              bullets: ['Delivered checkout APIs.'],
            },
            {
              title: 'Developer',
              companyName: 'Startup Antiga',
              bullets: ['Maintained APIs.'],
            },
          ],
          skills: ['Java'],
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce({
        text: JSON.stringify(degradedModelOutput),
      });

      const analysis = await provider.generateRewrittenProfile({
        profile: sampleProfile,
        objective: sampleObjective,
        confirmedFacts: [],
        initialReview: eliteReview,
      });

      expect(analysis.overallScore).toBe(91); // Clamped to initial 91
      expect(analysis.scores.searchRelevance).toBe(92); // Clamped to initial 92
      expect(analysis.scores.humanVoice).toBe(90); // Clamped to initial 90
      expect(analysis.scores.credibility).toBe(95); // Clamped to initial 95
      expect(analysis.scores.positioningClarity).toBe(90); // Clamped to initial 90
      expect(analysis.scores.evidenceCoverage).toBe(90); // Kept improved 90
    });
  });

  describe('Transient error handling and fallback without history corruption', () => {
    it('retries on 503 and switches to fallback model preserving uncorrupted history', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'test-api-key',
        model: 'gemini-3.5-flash',
        retryDelayMs: 0,
      });

      // Existing chat history before the failed call
      const cleanExistingHistory = [
        { role: 'user', parts: [{ text: 'Prior turn' }] },
        { role: 'model', parts: [{ text: 'Prior response' }] },
      ];
      chatHistoryStore = [...cleanExistingHistory];

      // Primary model (gemini-3.5-flash) encounters 503 on attempts 1, 2, 3
      const transientError = new Error('503 Service Unavailable: overloaded');
      (transientError as any).status = 503;

      mockChat.sendMessage
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        // Fallback model (gemini-3.6-flash) succeeds on first try
        .mockResolvedValueOnce({
          text: JSON.stringify({ questions: [] }),
        });

      const plan = await provider.generateInterview({
        profile: sampleProfile,
        objective: sampleObjective,
      });

      expect(plan.questions).toEqual([]);
      // Confirms fallback chat was created with the fallback model
      expect(mockChats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.6-flash',
          history: cleanExistingHistory,
        }),
      );
      // Provider model is updated to the working contingency model
      expect(provider.getModel()).toBe('gemini-3.6-flash');
    });

    it('throws immediately on auth errors without retrying or model switching', async () => {
      const provider = new GeminiAiProvider({
        apiKey: 'invalid-key',
        retryDelayMs: 0,
      });

      const authError = new Error('API key not valid. Please pass a valid API key.');
      (authError as any).status = 401;

      mockChat.sendMessage.mockRejectedValueOnce(authError);

      await expect(
        provider.generateInterview({
          profile: sampleProfile,
          objective: sampleObjective,
        }),
      ).rejects.toThrow('Chave de API do Gemini inválida');

      // Failed turn did not attempt retry loops across other models
      expect(mockChat.sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
