import { z } from 'zod';

export const yearMonthSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional(),
});

export type YearMonth = z.infer<typeof yearMonthSchema>;

export const dateRangeSchema = z.object({
  start: yearMonthSchema.optional(),
  end: yearMonthSchema.optional(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
