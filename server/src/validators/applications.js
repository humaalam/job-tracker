import { z } from 'zod';
import { optionalText, requiredText, notEmpty } from './common.js';

// Same values as the enums in schema.prisma.
export const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];
export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'];

const salary = z.number().int().min(0).nullish();

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
  .refine(...notEmpty)
  .refine(...checkSalaryRange);

// Query string values are always text, e.g. ?status=APPLIED,INTERVIEWING.
// This turns "A,B" into ['A', 'B'] and checks each value.
const commaList = (values) =>
  z
    .string()
    .transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean))
    .pipe(z.array(z.enum(values)).min(1));

export const SORT_FIELDS = ['updatedAt', 'createdAt', 'appliedAt', 'company', 'roleTitle', 'status', 'salaryMax'];

// GET /applications (and later the CSV export, which takes the same filters).
export const listQuerySchema = z.object({
  status: commaList(STATUSES).optional(),
  workMode: commaList(WORK_MODES).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(SORT_FIELDS).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  // coerce: turn the text "2" into the number 2 before checking it.
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// PATCH /:id/status (used by the Kanban board).
export const statusSchema = z.object({
  status: z.enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` }),
});
