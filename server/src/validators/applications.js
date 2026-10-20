import { z } from 'zod';

// Same values as the enums in schema.prisma.
export const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];
export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'];

// An optional free-text field: trimmed, with a length cap. null clears it on update.
const optionalText = (max) => z.string().trim().max(max).nullish();
const salary = z.number().int().min(0).nullish();
const requiredText = (label) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(200);

// The editable fields, without status. Kept unrefined so create and update can
// both build on it (zod can't .partial() or .omit() a schema that has a .refine).
const applicationFields = z.object({
  company: requiredText('Company'),
  roleTitle: requiredText('Role title'),
  jobUrl: z.url('Invalid URL').nullish(),
  location: optionalText(200),
  workMode: z.enum(WORK_MODES).nullish(),
  salaryMin: salary,
  salaryMax: salary,
  // Not nullable: the column always has a value (default USD).
  salaryCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code like USD')
    .optional(),
  jobDescription: optionalText(20000),
  resumeVersion: optionalText(100),
  coverLetterVersion: optionalText(100),
  notes: optionalText(5000),
});

// Also used by the service on update, where one of the two values may come from the database.
export const salaryRangeOk = ({ salaryMin, salaryMax }) =>
  salaryMin == null || salaryMax == null || salaryMin <= salaryMax;
export const SALARY_RANGE_MESSAGE = 'Max salary must be at least the min salary';

// Runs after the fields are valid. Fields not listed (e.g. userId) are dropped.
const checkSalaryRange = [salaryRangeOk, { message: SALARY_RANGE_MESSAGE, path: ['salaryMax'] }];

export const createApplicationSchema = applicationFields
  .extend({ status: z.enum(STATUSES).default('WISHLIST') })
  .refine(...checkSalaryRange);

// PATCH: every field is optional, but at least one must be sent.
// A status here is passed to the status-change service, like PATCH /:id/status.
export const updateApplicationSchema = applicationFields
  .extend({ status: z.enum(STATUSES) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Send at least one field to update' })
  .refine(...checkSalaryRange);

// PATCH /:id/status (used by the Kanban board).
export const statusSchema = z.object({
  status: z.enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` }),
});
