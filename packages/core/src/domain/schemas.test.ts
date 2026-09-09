import { describe, expect, it } from 'vitest';
import {
  profileSchema,
  certificationSchema,
  skillSchema,
  languageSchema,
} from './profile.js';
import {
  profileReviewSchema,
  profileAnalysisSchema,
  critiqueSeveritySchema,
  profileGapSchema,
  inboundStageSchema,
  inboundJourneySchema,
} from './analysis.js';
import {
  interviewPlanSchema,
  interviewQuestionSchema,
  confirmedFactSchema,
} from './interview.js';
import type {
  ParseAndDiagnoseInput,
  ParseAndDiagnoseResult,
  AiProvider,
} from './provider.js';

describe('Domain Schemas Robustness', () => {
  it('accepts skills as either strings or objects', () => {
    expect(skillSchema.parse('TypeScript')).toEqual({ name: 'TypeScript' });
    expect(skillSchema.parse({ name: 'TypeScript', endorsementCount: 12 })).toEqual({
      name: 'TypeScript',
      endorsementCount: 12,
    });
  });

  it('accepts certifications with empty url or string name', () => {
    expect(certificationSchema.parse('AWS Certified Solutions Architect')).toEqual({
      name: 'AWS Certified Solutions Architect',
    });
    expect(
      certificationSchema.parse({
        name: 'AWS SAA',
        issuer: 'AWS',
        url: '', // Empty string must not throw!
      }),
    ).toEqual({
      name: 'AWS SAA',
      issuer: 'AWS',
      url: '',
    });
  });

  it('accepts languages as strings or objects', () => {
    expect(languageSchema.parse('Inglês')).toEqual({ name: 'Inglês' });
    expect(languageSchema.parse({ name: 'Inglês', proficiency: 'Fluente' })).toEqual({
      name: 'Inglês',
      proficiency: 'Fluente',
    });
  });

  it('parses full profile with string skills and empty URLs without throwing', () => {
    const raw = {
      firstName: 'Carlos',
      skills: ['Java', 'Docker', 'Kubernetes'],
      languages: ['Português', 'Inglês'],
      certifications: [{ name: 'Cert 1', url: '' }],
      experiences: [
        {
          title: 'Senior Dev',
          companyName: 'Tech Co',
          current: 'true',
          workplaceType: 'remoto',
        },
      ],
    };

    const parsed = profileSchema.parse(raw);
    expect(parsed.firstName).toBe('Carlos');
    expect(parsed.skills).toEqual([
      { name: 'Java' },
      { name: 'Docker' },
      { name: 'Kubernetes' },
    ]);
    expect(parsed.languages).toEqual([{ name: 'Português' }, { name: 'Inglês' }]);
    expect(parsed.experiences[0].current).toBe(true);
    expect(parsed.experiences[0].workplaceType).toBe('remote');
  });

  it('coerces decimal scores and string numbers to integers in profile review', () => {
    const raw = {
      targetMarket: 'United States',
      language: 'en',
      overallScore: '42.4',
      scores: {
        searchRelevance: 48.7,
        humanVoice: '52',
        credibility: 38,
        positioningClarity: 35.2,
        evidenceCoverage: 37,
      },
      executiveSummary: 'Resumo',
      profileDirection: {
        positioning: 'Staff Engineer',
        primaryRole: 'Staff Backend Engineer',
        rationale: 'Razão',
      },
      critique: [
        {
          section: 'Headline',
          assessment: 'Ok',
          severity: 'grave', // Must map to high!
          issues: 'Single string issue', // Must map to array!
        },
      ],
    };

    const parsed = profileReviewSchema.parse(raw);
    expect(parsed.overallScore).toBe(42);
    expect(parsed.scores.searchRelevance).toBe(49);
    expect(parsed.scores.humanVoice).toBe(52);
    expect(parsed.scores.positioningClarity).toBe(35);
    expect(parsed.critique[0].severity).toBe('high');
    expect(parsed.critique[0].issues).toEqual(['Single string issue']);
  });

  it('validates scoreExplanations in profile review when provided', () => {
    const raw = {
      targetMarket: 'United States',
      language: 'en',
      overallScore: 90,
      scores: {
        searchRelevance: 90,
        humanVoice: 90,
        credibility: 90,
        positioningClarity: 90,
        evidenceCoverage: 90,
      },
      scoreExplanations: {
        searchRelevance: 'Headline clara com palavras-chave relevantes.',
        humanVoice: 'Tom executivo e conciso.',
        credibility: 'Experiência sólida comprovada.',
        positioningClarity: 'Posicionamento sênior alinhado.',
        evidenceCoverage: 'Métricas quantitativas no framework XYZ.',
      },
      executiveSummary: 'Resumo executivo factual.',
      profileDirection: {
        positioning: 'Staff Engineer',
        primaryRole: 'Staff Backend Engineer',
        rationale: 'Forte background técnico.',
      },
      critique: [],
    };

    const parsed = profileReviewSchema.parse(raw);
    expect(parsed.scoreExplanations?.searchRelevance).toBe('Headline clara com palavras-chave relevantes.');
    expect(parsed.scoreExplanations?.evidenceCoverage).toBe('Métricas quantitativas no framework XYZ.');
  });

  it('tolerates fuzzy interview categories and answer types', () => {
    const raw = {
      questions: [
        {
          id: 'q1',
          category: 'architecture and system design',
          question: 'Como você estruturou o sistema?',
          reason: 'Recrutadores querem ver design de sistemas.',
          answerType: 'text',
        },
      ],
    };

    const parsed = interviewPlanSchema.parse(raw);
    expect(parsed.questions[0].category).toBe('technical-depth');
    expect(parsed.questions[0].answerType).toBe('long-text');
  });

  it('tolerates various source labels for confirmed facts', () => {
    const fact1 = confirmedFactSchema.parse({
      id: 'f1',
      statement: 'Desenvolveu APIs em Go',
      source: 'linkedin',
    });
    expect(fact1.source).toBe('linkedin-profile');

    const fact2 = confirmedFactSchema.parse({
      id: 'f2',
      statement: 'Desenvolveu APIs em Go',
      source: 'resume-cv',
    });
    expect(fact2.source).toBe('linkedin-profile');
  });

  it('supports optional placeholderExample on interviewQuestionSchema and in interview plans', () => {
    const questionWithPlaceholder = interviewQuestionSchema.parse({
      id: 'q-scale',
      category: 'scale',
      question: 'Qual foi a volumetria de requisições?',
      reason: 'Avaliar compreensão de volume em produção.',
      placeholderExample: 'Ex: Sustentamos 15k req/s na Black Friday com latência p99 de 180ms.',
      answerType: 'long-text',
    });
    expect(questionWithPlaceholder.placeholderExample).toBe(
      'Ex: Sustentamos 15k req/s na Black Friday com latência p99 de 180ms.',
    );

    const questionWithoutPlaceholder = interviewQuestionSchema.parse({
      id: 'q-impact',
      category: 'impact',
      question: 'Qual foi o impacto do projeto?',
      reason: 'Avaliar impacto comercial.',
      answerType: 'short-text',
    });
    expect(questionWithoutPlaceholder.placeholderExample).toBeUndefined();

    const plan = interviewPlanSchema.parse({
      questions: [questionWithPlaceholder, questionWithoutPlaceholder],
    });
    expect(plan.questions[0].placeholderExample).toBe(
      'Ex: Sustentamos 15k req/s na Black Friday com latência p99 de 180ms.',
    );
    expect(plan.questions[1].placeholderExample).toBeUndefined();
  });
});

describe('profileReviewSchema triageBottlenecks', () => {
  it('defaults triageBottlenecks to an empty array when omitted', () => {
    const raw = {
      targetMarket: 'United States',
      language: 'en',
      overallScore: 75,
      scores: {
        searchRelevance: 75,
        humanVoice: 75,
        credibility: 75,
        positioningClarity: 75,
        evidenceCoverage: 75,
      },
      executiveSummary: 'Strong profile with minor gaps.',
      profileDirection: {
        positioning: 'Senior Backend Engineer',
        primaryRole: 'Senior Backend Engineer',
        rationale: 'Solid experience.',
      },
      critique: [],
    };

    const parsed = profileReviewSchema.parse(raw);
    expect(parsed.triageBottlenecks).toBeDefined();
    expect(Array.isArray(parsed.triageBottlenecks)).toBe(true);
    expect(parsed.triageBottlenecks).toEqual([]);
  });

  it('accepts and preserves triageBottlenecks array', () => {
    const bottlenecks = [
      'Unquantified impact metrics across senior experience bullets',
      'Headline lacks target role anchor and core technology keywords',
      'Portuguese profile prevents indexing by US recruiters',
    ];

    const raw = {
      targetMarket: 'United States',
      language: 'en',
      overallScore: 42,
      scores: {
        searchRelevance: 48,
        humanVoice: 52,
        credibility: 38,
        positioningClarity: 35,
        evidenceCoverage: 37,
      },
      executiveSummary: 'Needs significant overhaul for US recruiter 6-second scan.',
      profileDirection: {
        positioning: 'Senior Backend Engineer',
        primaryRole: 'Senior Backend Engineer',
        rationale: 'High technical baseline obscured by formatting.',
      },
      critique: [],
      triageBottlenecks: bottlenecks,
    };

    const parsed = profileReviewSchema.parse(raw);
    expect(parsed.triageBottlenecks).toEqual(bottlenecks);
    expect(parsed.triageBottlenecks).toHaveLength(3);
  });

  it('normalizes single string triageBottlenecks into an array', () => {
    const raw = {
      targetMarket: 'United States',
      language: 'en',
      overallScore: 50,
      scores: {
        searchRelevance: 50,
        humanVoice: 50,
        credibility: 50,
        positioningClarity: 50,
        evidenceCoverage: 50,
      },
      executiveSummary: 'Summary text',
      profileDirection: {
        positioning: 'Platform Engineer',
        primaryRole: 'Platform Engineer',
        rationale: 'Rationale',
      },
      critique: [],
      triageBottlenecks: 'Single bottleneck string from model',
    };

    const parsed = profileReviewSchema.parse(raw);
    expect(parsed.triageBottlenecks).toEqual(['Single bottleneck string from model']);
  });
});

describe('parseAndDiagnose domain contracts', () => {
  it('instantiates ParseAndDiagnoseInput and ParseAndDiagnoseResult correctly', () => {
    const input: ParseAndDiagnoseInput = {
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKNyAwIG9ia...',
      pdfText: 'Alexandre Rocha - Backend Developer',
      cvPdfBase64: 'JVBERi0xLjQK...',
      targetRole: 'Senior Distributed Systems Engineer',
      currentDate: '2026-09-08',
      chatHistory: [{ role: 'user', content: 'Turn 0' }],
    };

    expect(input.pdfBase64).toContain('JVBERi');
    expect(input.targetRole).toBe('Senior Distributed Systems Engineer');
    expect(input.chatHistory).toHaveLength(1);

    const parsedReview = profileReviewSchema.parse({
      overallScore: 45,
      scores: {
        searchRelevance: 45,
        humanVoice: 45,
        credibility: 45,
        positioningClarity: 45,
        evidenceCoverage: 45,
      },
      executiveSummary: 'Summary text',
      profileDirection: {
        positioning: 'Staff Engineer',
        primaryRole: 'Staff Backend Engineer',
        rationale: 'Rationale text',
      },
    });

    const parsedProfile = profileSchema.parse({
      firstName: 'Alexandre',
      lastName: 'Rocha',
      experiences: [],
    });

    const result: ParseAndDiagnoseResult = {
      profile: parsedProfile,
      review: parsedReview,
    };

    expect(result.profile.firstName).toBe('Alexandre');
    expect(result.review.overallScore).toBe(45);
    expect(result.review.triageBottlenecks).toEqual([]);
  });

  it('validates AiProvider interface compatibility with parseAndDiagnose and chat session hooks', async () => {
    const mockProvider: AiProvider = {
      id: 'test-provider',
      name: 'Test Provider',
      testConnection: async () => true,
      parseAndDiagnose: async (input: ParseAndDiagnoseInput): Promise<ParseAndDiagnoseResult> => {
        expect(input.pdfBase64).toBe('dGVzdC1iYXNlNjQ=');
        expect(input.targetRole).toBe('Senior Platform Engineer');
        expect(input.currentDate).toBe('2026-09-08');

        return {
          profile: profileSchema.parse({ firstName: 'Alex' }),
          review: profileReviewSchema.parse({
            targetMarket: 'United States',
            language: 'en',
            overallScore: 60,
            scores: {
              searchRelevance: 60,
              humanVoice: 60,
              credibility: 60,
              positioningClarity: 60,
              evidenceCoverage: 60,
            },
            executiveSummary: 'Contract test summary',
            profileDirection: {
              positioning: 'Senior Platform Engineer',
              primaryRole: 'Senior Platform Engineer',
              rationale: 'Contract test',
            },
            critique: [],
            triageBottlenecks: ['Lack of production scale metrics'],
          }),
        };
      },
      parseProfile: async () => {
        throw new Error('Deprecated method');
      },
      diagnoseProfile: async () => {
        throw new Error('Deprecated method');
      },
      generateInterview: async () => {
        throw new Error('Not implemented in contract test');
      },
      evaluateProgress: async () => {
        throw new Error('Not implemented in contract test');
      },
      generateRewrittenProfile: async () => {
        throw new Error('Not implemented in contract test');
      },
      getChatHistory: () => [{ role: 'user', parts: [{ text: 'Hello' }] }],
      restoreChatHistory: (_history: unknown[]) => {},
    };

    const input: ParseAndDiagnoseInput = {
      pdfBase64: 'dGVzdC1iYXNlNjQ=',
      targetRole: 'Senior Platform Engineer',
      currentDate: '2026-09-08',
    };

    expect(typeof mockProvider.parseAndDiagnose).toBe('function');
    const result = await mockProvider.parseAndDiagnose!(input);
    expect(result.profile.firstName).toBe('Alex');
    expect(result.review.triageBottlenecks).toEqual(['Lack of production scale metrics']);
    expect(mockProvider.getChatHistory?.()).toEqual([{ role: 'user', parts: [{ text: 'Hello' }] }]);
  });

  it('validates ProfileGap rigid typing and required fields', () => {
    const validGap = {
      id: 'gap-headline-1',
      label: 'Alinhar título ao cargo de contratação',
      targetSection: 'headline',
      suggestedUnlock: 'Remover termos passivos',
    };
    expect(profileGapSchema.parse(validGap)).toEqual(validGap);

    // Invalid targetSection throws
    expect(() =>
      profileGapSchema.parse({
        id: 'gap-invalid',
        label: 'Invalid section',
        targetSection: 'education',
      }),
    ).toThrow();
  });

  it('validates InboundStage and InboundJourney runtime Zod schemas', () => {
    const stage = {
      id: 'search',
      name: 'Busca',
      score: 85,
      status: 'ready',
      description: 'Indexação no Recruiter',
    };
    expect(inboundStageSchema.parse(stage)).toEqual(stage);

    const journey = {
      search: stage,
      card: { ...stage, id: 'card', name: 'Card', status: 'needs_attention' },
      profile: { ...stage, id: 'profile', name: 'Perfil', status: 'needs_attention' },
      inmail: { id: 'inmail', name: 'InMail', status: 'not_measurable' },
      stages: [stage],
    };
    expect(inboundJourneySchema.parse(journey).inmail.status).toBe('not_measurable');
  });
});

