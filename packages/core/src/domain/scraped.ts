import { z } from 'zod';
import {
  certificationSchema,
  educationSchema,
  experienceSchema,
  languageSchema,
  projectSchema,
} from './profile.js';

export const scrapedIdentitySchema = z.object({
  publicId: z.string().optional(),
  fullName: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
});
export type ScrapedIdentity = z.infer<typeof scrapedIdentitySchema>;

export const scrapedProfileSchema = z.object({
  identity: scrapedIdentitySchema.optional(),
  experiences: z.array(experienceSchema).optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  languages: z.array(languageSchema).optional(),
  updatedAt: z.number().optional(),
});
export type ScrapedProfile = z.infer<typeof scrapedProfileSchema>;
