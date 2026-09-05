import { z } from 'zod';
import { dateRangeSchema, yearMonthSchema } from './date-range.js';

export const workplaceTypeSchema = z.enum(['remote', 'hybrid', 'onsite']);
export type WorkplaceType = z.infer<typeof workplaceTypeSchema>;

export const experienceSchema = z.object({
  title: z.string(),
  companyName: z.string(),
  employmentType: z.string().optional(),
  workplaceType: workplaceTypeSchema.optional(),
  location: z.string().optional(),
  startDate: yearMonthSchema.optional(),
  endDate: yearMonthSchema.optional(),
  current: z.boolean().default(false),
  dateRangeText: z.string().optional(),
  durationText: z.string().optional(),
  description: z.string().optional(),
});
export type Experience = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  schoolName: z.string(),
  degreeName: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  grade: z.string().optional(),
  description: z.string().optional(),
  dateRange: dateRangeSchema.optional(),
});
export type Education = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: z.string(),
  endorsementCount: z.number().int().nonnegative().optional(),
});
export type Skill = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional(),
  issuedDate: dateRangeSchema.shape.start.optional(),
  expirationDate: dateRangeSchema.shape.end.optional(),
});
export type Certification = z.infer<typeof certificationSchema>;

export const projectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  dateRange: dateRangeSchema.optional(),
});
export type Project = z.infer<typeof projectSchema>;

export const languageSchema = z.object({
  name: z.string(),
  proficiency: z.string().optional(),
});
export type Language = z.infer<typeof languageSchema>;

export const honorSchema = z.object({
  title: z.string(),
  issuer: z.string().optional(),
  description: z.string().optional(),
  date: dateRangeSchema.shape.start.optional(),
});
export type Honor = z.infer<typeof honorSchema>;

export const profileSchema = z.object({
  publicId: z.string().default('user'),
  firstName: z.string(),
  lastName: z.string().default(''),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  languages: z.array(languageSchema).default([]),
  honors: z.array(honorSchema).default([]),
});
export type Profile = z.infer<typeof profileSchema>;
