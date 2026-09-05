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
