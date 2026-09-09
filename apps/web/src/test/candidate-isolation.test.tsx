import { describe, expect, it } from 'vitest';
import { getCandidateIdentityKey, extractLinkedInSlug, evaluateScoreTransition, type Profile } from '@linkegringo/core';

describe('Candidate Identity & Scope Isolation', () => {
  it('extracts canonical candidate keys from LinkedIn slugs', () => {
    const profile1: Partial<Profile> = {
      publicId: 'https://www.linkedin.com/in/carlos-silva-backend/',
      firstName: 'Carlos',
      lastName: 'Silva',
    };
    expect(getCandidateIdentityKey(profile1)).toBe('linkedin:carlos-silva-backend');

    const profile2: Partial<Profile> = {
      publicId: 'mariadev',
      firstName: 'Maria',
      lastName: 'Oliveira',
    };
    expect(getCandidateIdentityKey(profile2)).toBe('linkedin:mariadev');
  });

  it('identifies demo and mock profiles with stable demo sentinel key', () => {
    const demoProfile: Partial<Profile> = {
      publicId: 'demo-candidate',
      firstName: 'Alexandre',
      lastName: 'Rocha',
    };
    expect(getCandidateIdentityKey(demoProfile)).toBe('demo:candidate');
  });

  it('falls back to normalized full name when publicId is absent or invalid', () => {
    const anonProfile: Partial<Profile> = {
      publicId: 'unknown',
      firstName: 'Tiago',
      lastName: 'Santos Gringo',
    };
    expect(getCandidateIdentityKey(anonProfile)).toBe('name:tiago-santos-gringo');
  });

  it('prevents state bleeding across different candidates (different candidate keys)', () => {
    const candidateA = getCandidateIdentityKey({ publicId: 'candidate-a' });
    const candidateB = getCandidateIdentityKey({ publicId: 'candidate-b' });

    expect(candidateA).not.toBe(candidateB);
    expect(candidateA).toBe('linkedin:candidate-a');
    expect(candidateB).toBe('linkedin:candidate-b');
  });

  it('canonicalizes URLs with subpaths so the same candidate always produces identical keys', () => {
    const profileWithSubpath: Partial<Profile> = {
      publicId: 'https://www.linkedin.com/in/carlos-silva-backend/overlay/contact-info/',
      firstName: 'Carlos',
      lastName: 'Silva',
    };
    const profileClean: Partial<Profile> = {
      publicId: 'https://www.linkedin.com/in/carlos-silva-backend/',
      firstName: 'Carlos',
      lastName: 'Silva',
    };
    expect(getCandidateIdentityKey(profileWithSubpath)).toBe('linkedin:carlos-silva-backend');
    expect(getCandidateIdentityKey(profileWithSubpath)).toBe(getCandidateIdentityKey(profileClean));
  });

  it('enforces score hysteresis (±2 noise band) and monotonicity on profile rewrite', () => {
    // Drop within noise band (80 -> 79): preserved at 80
    expect(evaluateScoreTransition(80, 79)).toBe(80);
    expect(evaluateScoreTransition(80, 78)).toBe(80);

    // Increase is accepted immediately
    expect(evaluateScoreTransition(80, 85)).toBe(85);

    // Monotonicity prevents larger drops during refinement
    expect(evaluateScoreTransition(85, 70, { monotonic: true })).toBe(85);

    // Structured score object evaluation
    const prev = {
      overallScore: 88,
      scores: {
        searchRelevance: 90,
        humanVoice: 85,
        credibility: 90,
        positioningClarity: 85,
        evidenceCoverage: 88,
      },
    };
    const next = {
      overallScore: 87, // dropped by 1 -> stabilized to 88
      scores: {
        searchRelevance: 89, // dropped by 1 -> stabilized to 90
        humanVoice: 92, // improved -> 92
        credibility: 90, // unchanged -> 90
        positioningClarity: 84, // dropped by 1 -> stabilized to 85
        evidenceCoverage: 95, // improved -> 95
      },
    };
    const stabilized = evaluateScoreTransition(prev, next);
    expect(stabilized.overallScore).toBe(88);
    expect(stabilized.scores?.searchRelevance).toBe(90);
    expect(stabilized.scores?.humanVoice).toBe(92);
    expect(stabilized.scores?.positioningClarity).toBe(85);
    expect(stabilized.scores?.evidenceCoverage).toBe(95);
  });
});
