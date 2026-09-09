import { describe, expect, it } from 'vitest';
import {
  classifyGapTerm,
  termMatchesText,
  validateMicroIntegrationProposal,
  applyMicroIntegration,
  type MicroIntegrationInput,
  type MicroIntegrationProposal,
} from './micro-integration.js';
import type { ProfileAnalysis } from './analysis.js';

describe('MicroIntegration Domain Logic', () => {
  const mockAnalysis: ProfileAnalysis = {
    targetMarket: 'United States',
    language: 'en',
    scores: {
      searchRelevance: 75,
      humanVoice: 80,
      credibility: 85,
      positioningClarity: 70,
      evidenceCoverage: 78,
    },
    overallScore: 77,
    executiveSummary: 'Strong backend foundation with solid distributed systems experience.',
    profileDirection: {
      positioning: 'Senior Backend Engineer',
      primaryRole: 'Senior Backend Engineer',
      alternativeRoles: ['Senior Software Engineer'],
      rationale: 'Focus on distributed systems and microservices.',
    },
    critique: [],
    rewritten: {
      headline: 'Software Engineer | Node.js | Microservices',
      summary: 'Experienced engineer building scalable cloud systems.',
      experiences: [
        {
          title: 'Senior Backend Engineer',
          companyName: 'Fintech Corp',
          bullets: [
            'Architected distributed microservices in Node.js, reducing API response times by 35%.',
            'Implemented Redis caching layer to handle 10k requests per minute during peak transactions.',
          ],
        },
        {
          title: 'Software Engineer',
          companyName: 'Legacy Inc',
          bullets: [
            'Maintained legacy Java monolith and led cloud migration project.',
          ],
        },
      ],
      skills: ['Node.js', 'TypeScript', 'Redis', 'Docker'],
      openToWorkTitles: [
        'Senior Backend Engineer',
        'Senior Software Engineer',
        'Backend Developer',
        'Staff Engineer',
        'Cloud Engineer',
      ],
      cardConversionBadges: ['Senioridade clara', 'Stack de alta busca'],
    },
    triageBottlenecks: [],
  };

  describe('classifyGapTerm', () => {
    it('classifies roles correctly', () => {
      expect(classifyGapTerm('Staff Engineer')).toBe('role');
      expect(classifyGapTerm('Senior Backend Engineer')).toBe('role');
      expect(classifyGapTerm('Solutions Architect')).toBe('role');
      expect(classifyGapTerm('Tech Lead')).toBe('role');
    });

    it('classifies scale terms correctly', () => {
      expect(classifyGapTerm('High Scale')).toBe('scale');
      expect(classifyGapTerm('Low Latency')).toBe('scale');
      expect(classifyGapTerm('Throughput')).toBe('scale');
      expect(classifyGapTerm('Concurrency')).toBe('scale');
    });

    it('classifies concept terms correctly', () => {
      expect(classifyGapTerm('Microservices')).toBe('concept');
      expect(classifyGapTerm('Distributed Systems')).toBe('concept');
      expect(classifyGapTerm('Event-Driven')).toBe('concept');
      expect(classifyGapTerm('CQRS')).toBe('concept');
    });

    it('classifies tools correctly', () => {
      expect(classifyGapTerm('Docker')).toBe('tool');
      expect(classifyGapTerm('Kubernetes')).toBe('tool');
      expect(classifyGapTerm('Terraform')).toBe('tool');
      expect(classifyGapTerm('Datadog')).toBe('tool');
    });

    it('classifies domains correctly', () => {
      expect(classifyGapTerm('Fintech')).toBe('domain');
      expect(classifyGapTerm('E-commerce')).toBe('domain');
      expect(classifyGapTerm('Payments')).toBe('domain');
      expect(classifyGapTerm('SaaS')).toBe('domain');
    });

    it('defaults unknown technical names to technology', () => {
      expect(classifyGapTerm('Kafka')).toBe('technology');
      expect(classifyGapTerm('PostgreSQL')).toBe('technology');
      expect(classifyGapTerm('Golang')).toBe('technology');
    });
  });

  describe('validateMicroIntegrationProposal', () => {
    const validInput: MicroIntegrationInput = {
      targetRole: 'Senior Backend Engineer',
      gap: {
        id: 'gap-kafka',
        term: 'Kafka',
        status: 'missing',
        kind: 'technology',
        targetSection: 'experience',
        targetExperienceId: 'exp-0',
      },
      currentText: 'Implemented Redis caching layer to handle 10k requests per minute during peak transactions.',
      evidence: {
        status: 'confirmed',
        experienceId: 'exp-0',
        evidenceText: 'Used Kafka for event-driven asynchronous payment processing.',
        source: 'candidate',
      },
    };

    const validProposal: MicroIntegrationProposal = {
      status: 'ready',
      patchKind: 'experience_rewrite',
      term: 'Kafka',
      target: {
        section: 'experience',
        experienceId: 'exp-0',
      },
      before: 'Implemented Redis caching layer to handle 10k requests per minute during peak transactions.',
      after: 'Implemented Redis caching layer and Kafka event pipelines to handle 10k requests per minute during peak transactions.',
      rationale: 'Integrated Kafka truthfully using candidate confirmed evidence.',
      matchedEvidence: ['Used Kafka for event-driven asynchronous payment processing.'],
      warnings: [],
    };

    it('approves a valid proposal matching current analysis', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: validProposal,
        input: validInput,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(true);
      expect(validation.reasons).toHaveLength(0);
    });

    it('rejects if status is blocked', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: { ...validProposal, status: 'blocked', after: undefined },
        input: validInput,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reasons[0]).toContain("status 'blocked'");
    });

    it('rejects if candidate denied using the technology', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: validProposal,
        input: {
          ...validInput,
          evidence: { status: 'denied', source: 'candidate' },
        },
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reasons[0]).toContain('explicitamente negado');
    });

    it('rejects if generated after text omits target term', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: {
          ...validProposal,
          after: 'Implemented Redis caching layer to handle 10k requests per minute.', // No 'Kafka'
        },
        input: validInput,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reasons[0]).toContain('não contém o termo-alvo "Kafka"');
    });

    it('rejects if target experience does not exist in analysis', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: {
          ...validProposal,
          target: { section: 'experience', experienceId: 'exp-999' },
          before: 'Random text that does not exist',
        },
        input: validInput,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reasons[0]).toContain('não foi encontrada');
    });

    it('rejects if before text does not match bullet in target experience', () => {
      const validation = validateMicroIntegrationProposal({
        proposal: {
          ...validProposal,
          before: 'This text never existed in Fintech Corp.',
        },
        input: validInput,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(false);
      expect(validation.reasons[0]).toContain('não corresponde exatamente');
    });
  });

  describe('applyMicroIntegration', () => {
    it('performs exact in-place string replacement in targeted experience bullet', () => {
      const proposal: MicroIntegrationProposal = {
        status: 'ready',
        patchKind: 'experience_rewrite',
        term: 'Kafka',
        target: {
          section: 'experience',
          experienceId: 'exp-0',
        },
        before: 'Implemented Redis caching layer to handle 10k requests per minute during peak transactions.',
        after: 'Implemented Redis and Kafka streaming architecture to handle 10k requests per minute during peak transactions.',
        rationale: 'Integrated Kafka',
        matchedEvidence: [],
        warnings: [],
      };

      const result = applyMicroIntegration(mockAnalysis, proposal);

      // Verify diff
      expect(result.diff.section).toBe('experience');
      expect(result.diff.before).toBe(proposal.before);
      expect(result.diff.after).toBe(proposal.after);

      // Verify target experience bullet was updated
      const fintechExp = result.analysis.rewritten.experiences[0];
      expect(fintechExp.bullets[1]).toBe(proposal.after);
      // Untouched bullet remains identical
      expect(fintechExp.bullets[0]).toBe(mockAnalysis.rewritten.experiences[0].bullets[0]);

      // Untouched experience 2 remains identical
      expect(result.analysis.rewritten.experiences[1]).toEqual(mockAnalysis.rewritten.experiences[1]);

      // Original analysis is not mutated
      expect(mockAnalysis.rewritten.experiences[0].bullets[1]).toBe(proposal.before);
    });

    it('updates headline when target section is headline', () => {
      const proposal: MicroIntegrationProposal = {
        status: 'ready',
        patchKind: 'headline_replace',
        term: 'Kafka',
        target: {
          section: 'headline',
        },
        before: 'Software Engineer | Node.js | Microservices',
        after: 'Senior Backend Engineer | Node.js | Kafka | Microservices',
        rationale: 'Headline update',
        matchedEvidence: [],
        warnings: [],
      };

      const result = applyMicroIntegration(mockAnalysis, proposal);
      expect(result.diff.section).toBe('headline');
      expect(result.analysis.rewritten.headline).toBe(proposal.after);
    });

    it('prepends skill when target section is skills', () => {
      const proposal: MicroIntegrationProposal = {
        status: 'ready',
        patchKind: 'skill_add',
        term: 'Kafka',
        target: {
          section: 'skills',
        },
        before: '',
        after: 'Kafka',
        rationale: 'Skill addition',
        matchedEvidence: [],
        warnings: [],
      };

      const result = applyMicroIntegration(mockAnalysis, proposal);
      expect(result.diff.section).toBe('skills');
      expect(result.analysis.rewritten.skills[0]).toBe('Kafka');
      expect(result.analysis.rewritten.skills).toHaveLength(mockAnalysis.rewritten.skills.length + 1);
    });
  });

  describe('termMatchesText & Flexible Matching', () => {
    it('matches compound terms with hyphens, spaces, and underscores', () => {
      expect(termMatchesText('Engineered high-scale enterprise modules', 'High Scale')).toBe(true);
      expect(termMatchesText('Engineered high scale enterprise modules', 'High Scale')).toBe(true);
      expect(termMatchesText('Architected high_scale data pipelines', 'High Scale')).toBe(true);
      expect(termMatchesText('Supported high-scaling transactional workloads', 'High Scale')).toBe(true);
    });

    it('matches compound joined words like Full Stack and Front End', () => {
      expect(termMatchesText('Senior Full-Stack Engineer', 'Full Stack')).toBe(true);
      expect(termMatchesText('Senior Fullstack Engineer', 'Full Stack')).toBe(true);
      expect(termMatchesText('Frontend architecture and UI performance', 'Front End')).toBe(true);
    });

    it('matches technical terms with slashes and prefixes', () => {
      expect(termMatchesText('Designed CI-CD automation pipelines', 'CI/CD')).toBe(true);
      expect(termMatchesText('Automated CI/CD workflows with GitHub Actions', 'CI/CD')).toBe(true);
      expect(termMatchesText('Migrated to micro-services architecture', 'Microservices')).toBe(true);
      expect(termMatchesText('Decoupled microservices for resilience', 'Microservices')).toBe(true);
    });

    it('rejects completely unrelated content', () => {
      expect(termMatchesText('Built standard CRUD endpoints', 'High Scale')).toBe(false);
      expect(termMatchesText('Developed backend services', 'Kubernetes')).toBe(false);
    });

    it('validates proposal successfully when IA outputs hyphenated high-scale', () => {
      const proposal: MicroIntegrationProposal = {
        status: 'ready',
        patchKind: 'experience_rewrite',
        term: 'High Scale',
        target: {
          section: 'experience',
          experienceId: 'exp-0',
          bulletIndex: 0,
        },
        before: 'Architected distributed microservices in Node.js, reducing API response times by 35%.',
        after: 'Architected high-scale distributed microservices in Node.js, reducing API response times by 35%.',
        rationale: 'Integrates high-scale into bullet',
        matchedEvidence: ['grande escala'],
        warnings: [],
      };

      const input: MicroIntegrationInput = {
        targetRole: 'Senior Backend Engineer',
        gap: {
          id: 'gap-scale',
          term: 'High Scale',
          status: 'missing',
          kind: 'scale',
          targetSection: 'experience',
          targetExperienceId: 'exp-0',
        },
        currentText: proposal.before,
        evidence: {
          status: 'confirmed',
          experienceId: 'exp-0',
          evidenceText: 'grande escala',
          source: 'candidate',
        },
      };

      const validation = validateMicroIntegrationProposal({
        proposal,
        input,
        currentAnalysis: mockAnalysis,
      });

      expect(validation.valid).toBe(true);
      expect(validation.reasons).toEqual([]);
    });
  });
});
