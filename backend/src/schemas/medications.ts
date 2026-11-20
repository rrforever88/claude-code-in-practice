import { z } from 'zod';

export const createMedicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
});

export const updateMedicationSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    dosage: z.string().max(100).optional(),
    frequency: z.string().max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.dosage !== undefined ||
      d.frequency !== undefined ||
      d.isActive !== undefined,
    { message: 'At least one field must be provided' },
  );

export const createMedicationLogSchema = z.object({
  medicationId: z.string().uuid('Invalid medication ID'),
  taken: z.boolean(),
  takenAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateMedicationLogSchema = z
  .object({
    taken: z.boolean().optional(),
    takenAt: z.string().datetime().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.taken !== undefined || d.takenAt !== undefined || d.notes !== undefined, {
    message: 'At least one field must be provided',
  });

export const logQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
