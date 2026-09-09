import { describe, expect, it } from 'vitest';
import {
  normalizeScrapedProfile,
  extractLinkedInSlug,
  getCandidateIdentityKey,
  evaluateScoreTransition,
  deriveOpenToWorkTitles,
  deriveCardConversionBadges,
} from './normalize.js';
import type { ScrapedProfile } from './domain/scraped.js';

const base: ScrapedProfile = { updatedAt: 1 };

describe('normalizeScrapedProfile', () => {
  it('splits the full name and maps skills to objects', () => {
    const profile = normalizeScrapedProfile({
      ...base,
      identity: { publicId: 'joana-exemplo', fullName: 'Joana Exemplo', headline: 'Engenheira' },
      skills: ['Node.js', 'Redis'],
    });

    expect(profile.publicId).toBe('joana-exemplo');
    expect(profile.firstName).toBe('Joana');
    expect(profile.lastName).toBe('Exemplo');
    expect(profile.headline).toBe('Engenheira');
    expect(profile.skills).toEqual([{ name: 'Node.js' }, { name: 'Redis' }]);
  });

  it('keeps compound last names', () => {
    const profile = normalizeScrapedProfile({
      ...base,
      identity: { publicId: 'x', fullName: 'Ana Maria de Souza' },
    });

    expect(profile.firstName).toBe('Ana');
    expect(profile.lastName).toBe('Maria de Souza');
  });

  it('falls back to safe defaults when identity is missing', () => {
    const profile = normalizeScrapedProfile(base);

    expect(profile.publicId).toBe('unknown');
    expect(profile.firstName).toBe('');
    expect(profile.lastName).toBe('');
    expect(profile.experiences).toEqual([]);
    expect(profile.skills).toEqual([]);
  });

  it('handles a single-word name without a trailing space', () => {
    const profile = normalizeScrapedProfile({
      ...base,
      identity: { publicId: 'x', fullName: 'Madonna' },
    });

    expect(profile.firstName).toBe('Madonna');
    expect(profile.lastName).toBe('');
  });
});

describe('extractLinkedInSlug', () => {
  it('extracts plain slug directly for real users', () => {
    expect(extractLinkedInSlug('pedro-dev')).toBe('pedro-dev');
  });

  it('strips full LinkedIn URLs with https and www', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/pedro-dev/')).toBe('pedro-dev');
  });

  it('strips localized LinkedIn URLs like br.linkedin.com, pt.linkedin.com, and pt-br.linkedin.com', () => {
    expect(extractLinkedInSlug('https://br.linkedin.com/in/tiago-santos')).toBe('tiago-santos');
    expect(extractLinkedInSlug('http://pt.linkedin.com/in/joana-silva/')).toBe('joana-silva');
    expect(extractLinkedInSlug('https://pt-br.linkedin.com/in/pedro-dev/')).toBe('pedro-dev');
  });

  it('isolates the username slug when subsequent path segments are present', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/muriel-gasparini/overlay/contact-info/')).toBe('muriel-gasparini');
    expect(extractLinkedInSlug('https://www.linkedin.com/in/lucas-silva/details/experience/')).toBe('lucas-silva');
    expect(extractLinkedInSlug('in/ana-costa/details/skills')).toBe('ana-costa');
  });

  it('strips query parameters and URL fragments', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/maria-souza?locale=en_US#experience')).toBe('maria-souza');
    expect(extractLinkedInSlug('carlos-eng?trk=profile-badge')).toBe('carlos-eng');
  });

  it('filters out fallback sentinel values like unknown and user', () => {
    expect(extractLinkedInSlug('unknown')).toBeNull();
    expect(extractLinkedInSlug('user')).toBeNull();
    expect(extractLinkedInSlug('candidato')).toBeNull();
    expect(extractLinkedInSlug('')).toBeNull();
    expect(extractLinkedInSlug(undefined)).toBeNull();
    expect(extractLinkedInSlug(null)).toBeNull();
  });

  it('filters out demo and mock prefixes to prevent querying real LinkedIn profiles', () => {
    expect(extractLinkedInSlug('demo-candidate')).toBeNull();
    expect(extractLinkedInSlug('demo')).toBeNull();
    expect(extractLinkedInSlug('mock-user')).toBeNull();
    expect(extractLinkedInSlug('fictional-candidate')).toBeNull();
  });
});

describe('getCandidateIdentityKey', () => {
  it('returns linkedin:slug when valid publicId slug exists', () => {
    const key = getCandidateIdentityKey({
      publicId: 'https://www.linkedin.com/in/muriel-gasparini',
      firstName: 'Muriel',
      lastName: 'Gasparini',
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      honors: [],
    });
    expect(key).toBe('linkedin:muriel-gasparini');
  });

  it('returns demo:candidate for demo publicIds', () => {
    const key = getCandidateIdentityKey({
      publicId: 'demo-candidate',
      firstName: 'Alexandre',
      lastName: 'Rocha',
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      honors: [],
    });
    expect(key).toBe('demo:candidate');
  });

  it('falls back to name:first-last when publicId is unknown or placeholder', () => {
    const key = getCandidateIdentityKey({
      publicId: 'unknown',
      firstName: 'João',
      lastName: 'Silva Pereira',
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      honors: [],
    });
    expect(key).toBe('name:joao-silva-pereira');
  });

  it('returns candidate:anonymous when no publicId and no names are provided', () => {
    const key = getCandidateIdentityKey({
      publicId: 'user',
      firstName: '',
      lastName: '',
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      honors: [],
    });
    expect(key).toBe('candidate:anonymous');
  });
});

describe('evaluateScoreTransition', () => {
  it('stabilizes score within ±2 noise band when raw score regresses slightly', () => {
    // Drop of 1 point (94 -> 93) is suppressed by hysteresis
    expect(evaluateScoreTransition(94, 93)).toBe(94);
    // Drop of 2 points (94 -> 92) is suppressed by hysteresis
    expect(evaluateScoreTransition(94, 92)).toBe(94);
  });

  it('allows score increases and advances monotonically', () => {
    // 42 -> 94 is a significant improvement
    expect(evaluateScoreTransition(42, 94)).toBe(94);
    // 94 -> 96
    expect(evaluateScoreTransition(94, 96)).toBe(96);
  });

  it('enforces conditional monotonicity by default on larger drops', () => {
    // Monotonic refinement prevents regression below baseline
    expect(evaluateScoreTransition(90, 85)).toBe(90);
    // If monotonic is explicitly disabled, drop beyond noise band is accepted
    expect(evaluateScoreTransition(90, 85, { monotonic: false, noiseBand: 2 })).toBe(85);
  });

  it('evaluates transition on structured score objects', () => {
    const prev = {
      overallScore: 92,
      scores: {
        searchRelevance: 95,
        humanVoice: 90,
        credibility: 94,
        positioningClarity: 92,
        evidenceCoverage: 88,
      },
    };

    const current = {
      overallScore: 91, // dropped by 1 -> should stabilize to 92
      scores: {
        searchRelevance: 96, // improved -> 96
        humanVoice: 89, // dropped by 1 -> should stabilize to 90
        credibility: 93, // dropped by 1 -> should stabilize to 94
        positioningClarity: 95, // improved -> 95
        evidenceCoverage: 92, // improved -> 92
      },
    };

    const result = evaluateScoreTransition(prev, current);
    expect(result.overallScore).toBe(92);
    expect(result.scores?.searchRelevance).toBe(96);
    expect(result.scores?.humanVoice).toBe(90);
    expect(result.scores?.credibility).toBe(94);
    expect(result.scores?.positioningClarity).toBe(95);
    expect(result.scores?.evidenceCoverage).toBe(92);
  });
});

describe('deriveOpenToWorkTitles and deriveCardConversionBadges', () => {
  it('derives exactly 5 distinct target titles for Backend roles', () => {
    const titles = deriveOpenToWorkTitles('Senior Backend Engineer', ['Java Developer']);
    expect(titles).toHaveLength(5);
    expect(titles).toContain('Senior Backend Engineer');
    expect(titles).toContain('Java Developer');
    // Ensure uniqueness
    const unique = new Set(titles);
    expect(unique.size).toBe(5);
  });

  it('guarantees exactly 5 distinct titles for Mobile roles even with zero alternatives', () => {
    const titles = deriveOpenToWorkTitles('Senior Mobile Engineer');
    expect(titles).toHaveLength(5);
    const unique = new Set(titles);
    expect(unique.size).toBe(5);
    expect(titles).toContain('Senior Mobile Engineer');
  });

  it('guarantees exactly 5 distinct titles for arbitrary roles already prefixed with Senior', () => {
    const titles = deriveOpenToWorkTitles('Senior Security Engineer');
    expect(titles).toHaveLength(5);
    const unique = new Set(titles);
    expect(unique.size).toBe(5);
  });

  it('derives 3 conversion badges and rationale', () => {
    const { badges, reasons } = deriveCardConversionBadges();
    expect(badges).toHaveLength(3);
    expect(badges).toContain('Cargo semântico');
    expect(badges).toContain('Stack de alta busca');
    expect(badges).toContain('Senioridade clara');
    expect(reasons).toHaveLength(3);
  });
});
