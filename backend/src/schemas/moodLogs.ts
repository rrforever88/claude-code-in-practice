import { z } from 'zod';

const scoreField = (label: string) =>
  z.number().int().min(1, `${label} must be at least 1`).max(5, `${label} must be at most 5`);

export const createMoodLogSchema = z.object({
  moodScore: scoreField('Mood score'),
  energyLevel: scoreField('Energy level').optional(),
  stressLevel: scoreField('Stress level').optional(),
  notes: z.string().max(1000).optional(),
  loggedAt: z.string().datetime().optional(),
});

export const updateMoodLogSchema = z
  .object({
    moodScore: scoreField('Mood score').optional(),
    energyLevel: scoreField('Energy level').optional(),
    stressLevel: scoreField('Stress level').optional(),
    notes: z.string().max(1000).optional(),
    loggedAt: z.string().datetime().optional(),
  })
  .refine(
    (d) =>
      d.moodScore !== undefined ||
      d.energyLevel !== undefined ||
      d.stressLevel !== undefined ||
      d.notes !== undefined ||
      d.loggedAt !== undefined,
    { message: 'At least one field must be provided' },
  );

export const logQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
