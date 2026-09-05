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
} from './analysis.js';
import {
  interviewPlanSchema,
  confirmedFactSchema,
} from './interview.js';

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
});
