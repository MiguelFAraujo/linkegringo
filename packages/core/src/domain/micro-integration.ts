import { z } from 'zod';
import type { ProfileAnalysis, RewrittenProfile, RewrittenExperience } from './analysis.js';
import { profileAnalysisSchema } from './analysis.js';

export const gapTermKindSchema = z.enum([
  'role',
  'technology',
  'concept',
  'scale',
  'tool',
  'domain',
]);
export type GapTermKind = z.infer<typeof gapTermKindSchema>;

export const gapEvidenceStatusSchema = z.enum([
  'unverified',
  'confirmed',
  'denied',
  'ambiguous',
]);
export type GapEvidenceStatus = z.infer<typeof gapEvidenceStatusSchema>;

export const gapEvidenceSchema = z.object({
  status: gapEvidenceStatusSchema,
  experienceId: z.string().optional(),
  evidenceText: z.string().optional(),
  source: z.enum(['candidate', 'profile']),
});
export type GapEvidence = z.infer<typeof gapEvidenceSchema>;

export const searchGapSchema = z.object({
  id: z.string(),
  term: z.string(),
  status: z.enum(['weak', 'missing']),
  kind: gapTermKindSchema,
  targetSection: z.enum(['headline', 'about', 'experience', 'skills']),
  targetExperienceId: z.string().optional(),
  evidence: gapEvidenceSchema.optional(),
});
export type SearchGap = z.infer<typeof searchGapSchema>;

export const microPatchKindSchema = z.enum([
  'headline_replace',
  'about_insert',
  'experience_rewrite',
  'skill_add',
  'no_safe_change',
]);
export type MicroPatchKind = z.infer<typeof microPatchKindSchema>;

export const microIntegrationInputSchema = z.object({
  targetRole: z.string(),
  gap: searchGapSchema,
  currentText: z.string(),
  context: z
    .object({
      headline: z.string().optional(),
      summary: z.string().optional(),
      skills: z.array(z.string()).optional(),
      experience: z.any().optional(),
    })
    .optional(),
  evidence: gapEvidenceSchema,
  style: z
    .object({
      language: z.literal('en').default('en'),
      tone: z.literal('executive').default('executive'),
    })
    .optional(),
});
export type MicroIntegrationInput = z.infer<typeof microIntegrationInputSchema>;

export const microIntegrationProposalSchema = z.object({
  status: z.enum(['ready', 'blocked']),
  patchKind: microPatchKindSchema,
  term: z.string(),
  target: z.object({
    section: z.enum(['headline', 'about', 'experience', 'skills']),
    experienceId: z.string().optional(),
    bulletIndex: z.number().optional(),
  }),
  before: z.string(),
  after: z.string().optional(),
  rationale: z.string(),
  matchedEvidence: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type MicroIntegrationProposal = z.infer<typeof microIntegrationProposalSchema>;

export interface MicroIntegrationValidation {
  valid: boolean;
  reasons: string[];
}

export interface AppliedMicroIntegration {
  analysis: ProfileAnalysis;
  diff: {
    section: 'headline' | 'about' | 'experience' | 'skills';
    experienceId?: string;
    before: string;
    after: string;
  };
}

// ---------------------------------------------------------------------------
// 1. Explicit Curated Catalog + Deterministic Classifier
// ---------------------------------------------------------------------------

const ROLES_CATALOG = new Set([
  'senior software engineer',
  'senior backend engineer',
  'senior full stack engineer',
  'senior frontend engineer',
  'staff engineer',
  'principal engineer',
  'software architect',
  'solutions architect',
  'engineering manager',
  'tech lead',
  'lead engineer',
  'devops engineer',
  'sre',
  'site reliability engineer',
  'data engineer',
]);

const SCALE_CATALOG = new Set([
  'high scale',
  'large scale',
  'scale',
  'latency',
  'low latency',
  'high throughput',
  'throughput',
  'concurrency',
  'high concurrency',
  'fault tolerance',
  'high availability',
  'million users',
  'millions of requests',
  'p99',
  'sla',
  'slo',
]);

const CONCEPT_CATALOG = new Set([
  'microservices',
  'distributed systems',
  'event-driven',
  'event driven',
  'event-driven architecture',
  'message queues',
  'cqrs',
  'clean architecture',
  'domain-driven design',
  'ddd',
  'system design',
  'ci/cd',
  'iac',
  'infrastructure as code',
  'rest api',
  'graphql',
  'grpc',
  'observability',
  'micro-frontends',
]);

const TOOLS_CATALOG = new Set([
  'docker',
  'kubernetes',
  'k8s',
  'terraform',
  'ansible',
  'helm',
  'git',
  'github actions',
  'gitlab ci',
  'jenkins',
  'datadog',
  'grafana',
  'prometheus',
  'elastic',
  'elasticsearch',
  'kibana',
]);

const DOMAINS_CATALOG = new Set([
  'fintech',
  'e-commerce',
  'ecommerce',
  'healthcare',
  'healthtech',
  'edtech',
  'adtech',
  'saas',
  'b2b',
  'b2c',
  'banking',
  'crypto',
  'web3',
  'payments',
  'telecom',
]);

export function classifyGapTerm(term: string): GapTermKind {
  const clean = term.toLowerCase().trim().replace(/^["']|["']$/g, '');

  if (ROLES_CATALOG.has(clean)) return 'role';
  if (SCALE_CATALOG.has(clean)) return 'scale';
  if (CONCEPT_CATALOG.has(clean)) return 'concept';
  if (TOOLS_CATALOG.has(clean)) return 'tool';
  if (DOMAINS_CATALOG.has(clean)) return 'domain';

  // Heuristic Fallback
  if (/\b(?:engineer|developer|architect|lead|manager|specialist|officer)\b/i.test(clean)) {
    return 'role';
  }
  if (/\b(?:latency|throughput|p99|scale|bandwidth|concurrency|sla|volume)\b/i.test(clean)) {
    return 'scale';
  }
  if (/\b(?:architecture|distributed|messaging|cqrs|event|microservices|streaming|design|pattern)\b/i.test(clean)) {
    return 'concept';
  }
  if (/\b(?:docker|k8s|kubernetes|terraform|helm|actions|ci|cd|jenkins|aws|gcp|azure)\b/i.test(clean)) {
    return 'tool';
  }
  if (/\b(?:fintech|health|banking|payments|retail|ecommerce|saas|logistics)\b/i.test(clean)) {
    return 'domain';
  }

  // Default to technology for programming languages, frameworks, libraries, databases
  return 'technology';
}

/**
 * Evaluates whether a text block contains a search term.
 * Supports:
 * - Direct case-insensitive substring matching
 * - Punctuation/whitespace interchangeability (e.g. "High Scale" matches "high-scale", "high_scale", "high scale")
 * - Morphological variations (e.g. "high scale" -> "high-scaling", "high-scaled")
 * - Compound word joined forms (e.g. "Full Stack" matches "fullstack" and "full-stack", "Front End" matches "frontend")
 * - Hyphenated prefix forms (e.g. "microservices" matches "micro-services")
 */
export function termMatchesText(content: string, term: string): boolean {
  if (!content || !term) return false;
  const cleanTerm = term.trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (cleanTerm.length === 0) return false;

  const cleanContent = content.toLowerCase();

  const words = cleanTerm.split(/[\s\-_/]+/).filter(Boolean);
  if (words.length === 0) return false;

  if (words.length > 1) {
    const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const lastWord = words[words.length - 1];
    const escapedLast = escapedWords[escapedWords.length - 1];
    
    // Support English inflection rules (e.g. scale -> scaling/scaled, test -> testing/tested)
    let stemPattern = `${escapedLast}(?:s|es|d|ed|ing)?`;
    if (lastWord.length > 3 && lastWord.endsWith('e')) {
      const root = lastWord.slice(0, -1);
      const escapedRoot = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      stemPattern = `(?:${escapedLast}(?:s|d)?|${escapedRoot}(?:ing|ed)?)`;
    }

    const flexiblePattern =
      '(?:^|[^a-z0-9])' +
      escapedWords.slice(0, -1).join('[\\s\\-_/]+') +
      '[\\s\\-_/]+' +
      stemPattern +
      '(?:[^a-z0-9]|$)';
    try {
      const rx = new RegExp(flexiblePattern, 'i');
      if (rx.test(cleanContent)) return true;
    } catch {
      // Fallback to substring
    }

    // Also check compound joined form (e.g. "full stack" -> "fullstack", "front end" -> "frontend")
    const joined = words.join('');
    const joinedRx = new RegExp(`(?:^|[^a-z0-9])${joined}(?:[^a-z0-9]|$)`, 'i');
    if (joinedRx.test(cleanContent)) return true;
  } else if (words.length === 1) {
    // Single word: check with word boundaries, hyphenated splits, or common suffixes
    const word = words[0];
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Standard boundary match with plural/verb inflection
    const rx = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:s|es|d|ed|ing)?(?:[^a-z0-9]|$)`, 'i');
    if (rx.test(cleanContent)) return true;

    // Check if word appears hyphenated (e.g. "microservices" -> "micro-services")
    if (word.length > 6) {
      const prefixMatch = word.match(/^(micro|multi|cross|inter|sub|meta)(.*)$/);
      if (prefixMatch) {
        const hyphenated = `${prefixMatch[1]}-${prefixMatch[2]}`;
        if (cleanContent.includes(hyphenated)) return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 2. State-Verifiable Proposal Validation
// ---------------------------------------------------------------------------

export function validateMicroIntegrationProposal({
  proposal,
  input,
  currentAnalysis,
}: {
  proposal: MicroIntegrationProposal;
  input: MicroIntegrationInput;
  currentAnalysis: ProfileAnalysis;
}): MicroIntegrationValidation {
  const reasons: string[] = [];

  // Rule 1: Status must be ready
  if (proposal.status !== 'ready') {
    reasons.push(`A proposta está com status '${proposal.status}' (bloqueada pela IA).`);
    return { valid: false, reasons };
  }

  // Rule 2: Cannot integrate if candidate denied the evidence
  if (input.evidence.status === 'denied') {
    reasons.push('Não é permitido integrar um termo explicitamente negado pelo candidato.');
    return { valid: false, reasons };
  }

  // Rule 3: Must contain 'after' string
  if (!proposal.after || !proposal.after.trim()) {
    reasons.push('A proposta da IA não contém o texto de substituição (after).');
    return { valid: false, reasons };
  }

  // Rule 4: The new text must actually contain the target term (case-insensitive & flexible hyphenation/spacing)
  if (!termMatchesText(proposal.after, proposal.term)) {
    reasons.push(`O texto gerado pela IA não contém o termo-alvo "${proposal.term}".`);
  }

  // Rule 5: Section verification against currentAnalysis
  const targetSection = proposal.target.section;
  const currentRewritten = currentAnalysis.rewritten;

  if (targetSection === 'experience') {
    const experiences = currentRewritten.experiences || [];
    const expId = proposal.target.experienceId || input.gap.targetExperienceId;
    
    // Find target experience either by ID or by matching companyName
    const targetExp = experiences.find(
      (e, idx) =>
        (e as any).id === expId ||
        `exp-${idx}` === expId ||
        (proposal.before && e.bullets.some((b) => b.includes(proposal.before) || proposal.before.includes(b)))
    );

    if (!targetExp) {
      reasons.push(`Experiência-alvo "${expId || 'desconhecida'}" não foi encontrada no perfil atual.`);
    } else {
      // Ensure 'before' matches at least one bullet in the target experience
      const matchingBullet = targetExp.bullets.find(
        (b) => b === proposal.before || b.trim() === proposal.before.trim()
      );

      if (!matchingBullet && proposal.patchKind === 'experience_rewrite') {
        reasons.push('O texto original (before) não corresponde exatamente a nenhum bullet da experiência-alvo.');
      }
    }
  } else if (targetSection === 'headline') {
    if (proposal.patchKind === 'headline_replace' && proposal.before.trim() !== currentRewritten.headline.trim()) {
      reasons.push('O texto original (before) não corresponde à Headline atual do perfil.');
    }
  } else if (targetSection === 'about') {
    if (proposal.before && !currentRewritten.summary.includes(proposal.before)) {
      reasons.push('O texto original (before) não foi encontrado no Summary atual do perfil.');
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// 3. Exact In-Place Patch Application
// ---------------------------------------------------------------------------

export function applyMicroIntegration(
  currentAnalysis: ProfileAnalysis,
  proposal: MicroIntegrationProposal
): AppliedMicroIntegration {
  if (proposal.status !== 'ready' || !proposal.after) {
    throw new Error(`Não é possível aplicar uma proposta no estado "${proposal.status}".`);
  }

  const nextRewritten: RewrittenProfile = {
    ...currentAnalysis.rewritten,
    experiences: currentAnalysis.rewritten.experiences.map((exp) => ({
      ...exp,
      bullets: [...exp.bullets],
    })),
    skills: [...currentAnalysis.rewritten.skills],
  };

  const targetSection = proposal.target.section;
  let diffExperienceId: string | undefined = proposal.target.experienceId;

  if (targetSection === 'experience') {
    const expId = proposal.target.experienceId;
    let found = false;

    // Find and update exact bullet in target experience
    nextRewritten.experiences = nextRewritten.experiences.map((exp, idx) => {
      const isTarget =
        (exp as any).id === expId ||
        `exp-${idx}` === expId ||
        exp.bullets.some((b) => b.trim() === proposal.before.trim());

      if (isTarget && !found) {
        found = true;
        diffExperienceId = (exp as any).id || `exp-${idx}`;
        const bulletIdx = exp.bullets.findIndex((b) => b.trim() === proposal.before.trim());
        if (bulletIdx >= 0) {
          exp.bullets[bulletIdx] = proposal.after!.trim();
        } else {
          // If inserting a new bullet into the experience
          exp.bullets.push(proposal.after!.trim());
        }
      }
      return exp;
    });

    if (!found && nextRewritten.experiences.length > 0) {
      // Fallback: apply to first experience
      diffExperienceId = (nextRewritten.experiences[0] as any).id || 'exp-0';
      nextRewritten.experiences[0].bullets.push(proposal.after.trim());
    }
  } else if (targetSection === 'headline') {
    nextRewritten.headline = proposal.after.trim();
  } else if (targetSection === 'about') {
    if (proposal.before && nextRewritten.summary.includes(proposal.before)) {
      nextRewritten.summary = nextRewritten.summary.replace(proposal.before, proposal.after.trim());
    } else {
      nextRewritten.summary = `${nextRewritten.summary}\n\n${proposal.after.trim()}`;
    }
  } else if (targetSection === 'skills') {
    const cleanTerm = proposal.term.trim();
    if (!nextRewritten.skills.some((s) => s.toLowerCase() === cleanTerm.toLowerCase())) {
      nextRewritten.skills.unshift(cleanTerm);
    }
  }

  const nextAnalysis: ProfileAnalysis = {
    ...currentAnalysis,
    rewritten: nextRewritten,
  };

  return {
    analysis: profileAnalysisSchema.parse(nextAnalysis),
    diff: {
      section: targetSection,
      experienceId: diffExperienceId,
      before: proposal.before,
      after: proposal.after.trim(),
    },
  };
}
