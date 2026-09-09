import { profileSchema, type Profile } from './domain/profile.js';
import type { ScrapedProfile } from './domain/scraped.js';

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

export function normalizeScrapedProfile(scraped: ScrapedProfile): Profile {
  const identity = scraped.identity;
  const { firstName, lastName } = splitFullName(identity?.fullName ?? '');
  const publicId = identity?.publicId !== undefined && identity.publicId.length > 0 ? identity.publicId : 'unknown';

  return profileSchema.parse({
    publicId,
    firstName,
    lastName,
    headline: identity?.headline,
    location: identity?.location,
    summary: identity?.summary,
    experiences: scraped.experiences ?? [],
    education: scraped.education ?? [],
    skills: (scraped.skills ?? []).map((name) => ({ name })),
    certifications: scraped.certifications ?? [],
    projects: scraped.projects ?? [],
    languages: scraped.languages ?? [],
    honors: [],
  });
}

const INVALID_PLACEHOLDERS = new Set(['user', 'unknown', 'candidato', 'profile', 'null', 'undefined']);
const DEMO_PLACEHOLDERS = new Set([
  'demo',
  'mock',
  'demo-candidate',
  'demo-profile',
  'candidato-demo',
  'fictional',
  'fictional-candidate',
]);

export function extractLinkedInSlug(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let slug = raw.trim();
  if (!slug) return null;

  // Strip surrounding quotes
  slug = slug.replace(/^["']+|["']+$/g, '').trim();

  // Strip query parameters and URL fragments
  slug = slug.replace(/[?#].*$/, '');

  // Strip full URL protocols and any localized LinkedIn domains (e.g., https://pt-br.linkedin.com/in/)
  slug = slug.replace(/^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com\/in\//i, '');
  slug = slug.replace(/^\/?in\//i, '');
  slug = slug.replace(/^@/, '');

  // Isolate the first path segment (e.g. strips /overlay/contact-info/ or /details/skills/)
  slug = slug.split('/')[0].trim();

  const lower = slug.toLowerCase();
  if (
    !slug ||
    INVALID_PLACEHOLDERS.has(lower) ||
    DEMO_PLACEHOLDERS.has(lower) ||
    lower.startsWith('demo-') ||
    lower.startsWith('mock-') ||
    lower.startsWith('fictional-')
  ) {
    return null;
  }

  return slug;
}

/**
 * Resolves a stable, candidate-scoped identity key.
 * Used to isolate baselines, session state, and score hysteresis.
 * When a new or different candidate is uploaded, history is completely reset.
 */
export function getCandidateIdentityKey(profile: Partial<Profile>): string {
  // 1. Primary: Clean canonical LinkedIn slug
  const slug = extractLinkedInSlug(profile.publicId);
  if (slug) {
    return `linkedin:${slug.toLowerCase()}`;
  }

  // 2. Demo sentinel check
  const rawPublicId = (profile.publicId || '').trim().toLowerCase();
  if (
    rawPublicId === 'demo' ||
    rawPublicId.startsWith('demo-') ||
    rawPublicId.startsWith('mock-') ||
    rawPublicId.startsWith('fictional-')
  ) {
    return 'demo:candidate';
  }

  // 3. Fallback to normalized candidate name
  const fullName = [profile.firstName, profile.lastName]
    .map((s) => (s || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (fullName.length > 0) {
    const slugified = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slugified.length > 0) {
      return `name:${slugified}`;
    }
  }

  return 'candidate:anonymous';
}

export interface ScoreTransitionOptions {
  noiseBand?: number; // default 2 (±2 points noise floor)
  monotonic?: boolean; // default true (conditional monotonicity under refinement)
}

/**
 * Candidate-scoped score stabilization with hysteresis (±2 points noise band) and conditional monotonicity.
 * Prevents non-deterministic LLM jitter from regressing scores when a candidate provides additional
 * evidence or refines their profile.
 */
export function evaluateScoreTransition(
  previousScore: number,
  newRawScore: number,
  options?: ScoreTransitionOptions,
): number;
export function evaluateScoreTransition<T extends { overallScore: number; scores?: Record<string, number> }>(
  previous: T,
  current: T,
  options?: ScoreTransitionOptions,
): T;
export function evaluateScoreTransition(
  previous: any,
  current: any,
  options?: ScoreTransitionOptions,
): any {
  const noiseBand = options?.noiseBand ?? 2;
  const monotonic = options?.monotonic ?? true;

  if (typeof previous === 'number' && typeof current === 'number') {
    const prev = Math.round(previous);
    const curr = Math.round(current);

    // If new score is lower than previous:
    if (curr < prev) {
      // If conditional monotonicity applies OR the drop is within the ±2 noise band:
      if (monotonic || prev - curr <= noiseBand) {
        return prev;
      }
    }

    return Math.min(100, Math.max(0, curr));
  }

  if (typeof previous === 'object' && previous !== null && typeof current === 'object' && current !== null) {
    const stabilizedOverall = evaluateScoreTransition(
      previous.overallScore,
      current.overallScore,
      options,
    );

    let stabilizedScores = current.scores;
    if (previous.scores && current.scores) {
      stabilizedScores = { ...current.scores };
      for (const [key, currVal] of Object.entries(current.scores)) {
        if (typeof currVal === 'number' && typeof previous.scores[key] === 'number') {
          stabilizedScores[key] = evaluateScoreTransition(
            previous.scores[key],
            currVal,
            options,
          );
        }
      }
    }

    return {
      ...current,
      overallScore: stabilizedOverall,
      scores: stabilizedScores,
    };
  }

  return current;
}

/**
 * Derives exactly 5 high-converting Open to Work target titles for LinkedIn Recruiter Spotlight.
 */
export function deriveOpenToWorkTitles(
  primaryRole?: string,
  alternativeRoles?: string[],
): string[] {
  const role = primaryRole?.trim() || 'Senior Software Engineer';
  const alts = (alternativeRoles || []).map((r) => r.trim()).filter(Boolean);

  const pool: string[] = [role, ...alts];

  // Domain-specific standard variants if pool has fewer than 5
  const isBackend = /backend|back-end|java|node|python|go|distributed/i.test(role);
  const isFrontend = /frontend|front-end|react|web|ui/i.test(role);
  const isFullStack = /full[\s-]?stack/i.test(role);
  const isMobile = /mobile|ios|android|flutter|react native|swift|kotlin/i.test(role);
  const isData = /data|analytics|etl|pipeline|machine learning|ai\b/i.test(role);
  const isDevOps = /devops|sre|platform|infra|cloud|security/i.test(role);

  let defaults: string[] = [];
  if (isBackend) {
    defaults = [
      'Senior Backend Engineer',
      'Senior Software Engineer',
      'Distributed Systems Engineer',
      'Backend Tech Lead',
      'Senior Systems Engineer',
      'Staff Backend Engineer',
      'Lead Software Engineer',
    ];
  } else if (isFrontend) {
    defaults = [
      'Senior Frontend Engineer',
      'Senior Software Engineer',
      'Staff Frontend Engineer',
      'Frontend Tech Lead',
      'Senior UI/UX Engineer',
      'Senior Web Engineer',
    ];
  } else if (isFullStack) {
    defaults = [
      'Senior Full Stack Engineer',
      'Senior Software Engineer',
      'Staff Full Stack Engineer',
      'Full Stack Tech Lead',
      'Senior Application Engineer',
      'Lead Full Stack Engineer',
    ];
  } else if (isMobile) {
    defaults = [
      'Senior Mobile Engineer',
      'Senior iOS Engineer',
      'Senior Android Engineer',
      'Mobile Tech Lead',
      'Staff Mobile Engineer',
      'Senior Software Engineer',
    ];
  } else if (isData) {
    defaults = [
      'Senior Data Engineer',
      'Lead Data Engineer',
      'Staff Data Engineer',
      'Data Platform Engineer',
      'Big Data Engineer',
      'Senior Software Engineer',
    ];
  } else if (isDevOps) {
    defaults = [
      'Senior DevOps Engineer',
      'Senior Platform Engineer',
      'Site Reliability Engineer (SRE)',
      'Lead Infrastructure Engineer',
      'Senior Cloud Engineer',
      'Senior Systems Engineer',
    ];
  } else {
    const base = role.replace(/^(?:Senior|Staff|Lead|Principal|Junior|Mid-level|Pleno|Sênior)\s+/i, '').trim();
    defaults = [
      role,
      `Senior ${base}`,
      `Staff ${base}`,
      `Lead ${base}`,
      `${base} Lead`,
      `Principal ${base}`,
      'Senior Software Engineer',
      'Software Engineer',
    ];
  }

  for (const d of defaults) {
    if (!pool.some((p) => p.toLowerCase() === d.toLowerCase())) {
      pool.push(d);
    }
  }

  return pool.slice(0, 5);
}

/**
 * Derives conversion badges and recruiter rationale for the Recruiter Search Card.
 */
export function deriveCardConversionBadges(
  _profile?: Profile,
  _rewrittenHeadline?: string,
): { badges: string[]; reasons: string[] } {
  return {
    badges: ['Cargo semântico', 'Stack de alta busca', 'Senioridade clara'],
    reasons: [
      'Cargo semântico: Alinhado diretamente com o filtro de "Current Job Title" mais utilizado por tech recruiters dos EUA.',
      'Stack de alta busca: As tecnologias centrais são dispostas nos primeiros 60 caracteres sem truncamento no snippet de busca.',
      'Senioridade clara: Declaração inequívoca de escopo de sistemas que elimina o descarte na triagem de 6 segundos.',
    ],
  };
}

export interface StabilizeInboundReadinessInput {
  candidateId?: string;
  evidenceHash?: string;
  previousScore?: number;
  rawScore: number;
  hasMaterialImprovement?: boolean;
  noiseBand?: number;
}

const candidateScoreRegistry = new Map<string, { score: number; evidenceHash?: string }>();

export function clearCandidateScoreRegistry(): void {
  candidateScoreRegistry.clear();
}

/**
 * Stabilizes candidate-scoped Inbound Readiness score against LLM jitter.
 * Prevents non-deterministic regressions when candidate refines profile or adds evidence,
 * applying hysteresis (±2 points default noise band) and conditional monotonicity.
 */
export function stabilizeInboundReadiness(input: StabilizeInboundReadinessInput): number {
  const {
    candidateId,
    evidenceHash,
    previousScore,
    rawScore,
    hasMaterialImprovement = false,
    noiseBand = 2,
  } = input;
  const curr = Math.min(100, Math.max(0, Math.round(rawScore)));

  const recorded = candidateId ? candidateScoreRegistry.get(candidateId) : undefined;
  const effectivePrev = previousScore ?? recorded?.score;

  if (effectivePrev === undefined || effectivePrev === null) {
    if (candidateId) {
      candidateScoreRegistry.set(candidateId, { score: curr, evidenceHash });
    }
    return curr;
  }

  const prev = Math.round(effectivePrev);
  let finalScore = curr;

  // If evidence is unchanged, pure LLM jitter regression is suppressed
  const isUnchangedEvidence = Boolean(evidenceHash && recorded?.evidenceHash && evidenceHash === recorded.evidenceHash);

  if (curr < prev) {
    // If material improvement is declared, regression is within noise band, or evidence hash is unchanged: maintain previous score
    if (hasMaterialImprovement || isUnchangedEvidence || prev - curr <= noiseBand) {
      finalScore = prev;
    }
  }

  if (candidateId) {
    candidateScoreRegistry.set(candidateId, { score: finalScore, evidenceHash });
  }

  return finalScore;
}

