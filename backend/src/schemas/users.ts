import { z } from 'zod';

const IANA_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

export const updateUserSchema = z
  .object({
    displayName: z.string().min(1, 'Display name is required').max(100).optional(),
    timezone: z
      .string()
      .refine((tz) => IANA_TIMEZONES.has(tz), { message: 'Invalid IANA timezone' })
      .optional(),
  })
  .refine((data) => data.displayName !== undefined || data.timezone !== undefined, {
    message: 'At least one field (displayName or timezone) must be provided',
  });
