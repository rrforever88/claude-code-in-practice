import { z } from 'zod';

export const createSymptomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.string().min(1, 'Category is required').max(100),
});

export const updateSymptomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (d) => d.name !== undefined || d.category !== undefined || d.isActive !== undefined,
  { message: 'At least one field must be provided' },
);

export const createSymptomLogSchema = z.object({
  symptomId: z.string().uuid('Invalid symptom ID'),
  severity: z.number().int().min(1, 'Severity must be at least 1').max(10, 'Severity must be at most 10'),
  notes: z.string().max(1000).optional(),
  loggedAt: z.string().datetime().optional(),
});

export const updateSymptomLogSchema = z.object({
  severity: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
  loggedAt: z.string().datetime().optional(),
}).refine(
  (d) => d.severity !== undefined || d.notes !== undefined || d.loggedAt !== undefined,
  { message: 'At least one field must be provided' },
);

export const logQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
