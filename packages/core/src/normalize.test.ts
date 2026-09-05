import { describe, expect, it } from 'vitest';
import { normalizeScrapedProfile } from './normalize.js';
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
