import { z } from 'zod';

const trackingType = z.enum(['BOOLEAN', 'NUMERIC', 'DURATION']);

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  trackingType,
  unit: z.string().max(50).optional(),
});

export const updateHabitSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    unit: z.string().max(50).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) => d.name !== undefined || d.unit !== undefined || d.isActive !== undefined,
    { message: 'At least one field must be provided' },
  );

export const createHabitLogSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID'),
  valueBoolean: z.boolean().optional(),
  valueNumeric: z.number().optional(),
  valueDuration: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  loggedAt: z.string().datetime().optional(),
});

export const updateHabitLogSchema = z
  .object({
    valueBoolean: z.boolean().optional(),
    valueNumeric: z.number().optional(),
    valueDuration: z.number().int().min(0).optional(),
    notes: z.string().max(1000).optional(),
    loggedAt: z.string().datetime().optional(),
  })
  .refine(
    (d) =>
      d.valueBoolean !== undefined ||
      d.valueNumeric !== undefined ||
      d.valueDuration !== undefined ||
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
