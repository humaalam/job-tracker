import { z } from 'zod';
import { optionalText, notEmpty } from './common.js';

// Same values as the enums in schema.prisma.
export const INTERVIEW_TYPES = [
  'PHONE_SCREEN',
  'TECHNICAL',
  'BEHAVIORAL',
  'TAKE_HOME',
  'ONSITE',
  'FINAL',
  'OTHER',
];
export const INTERVIEW_OUTCOMES = ['PENDING', 'PASSED', 'FAILED', 'CANCELLED'];

const interviewFields = z.object({
  type: z.enum(INTERVIEW_TYPES, { error: `Type must be one of: ${INTERVIEW_TYPES.join(', ')}` }),
  // A full date-time with a timezone (Z or +02:00), so "14:00" can't be read
  // in the wrong timezone. Turned into a Date for Prisma.
  scheduledAt: z.iso
    .datetime({ offset: true, error: 'Use a date-time with a timezone, like 2026-10-21T14:00:00Z' })
    .transform((s) => new Date(s)),
  durationMinutes: z.number().int().min(1).max(1440).nullish(),
  locationOrLink: optionalText(500),
  interviewers: optionalText(500),
  // Not nullable: the column always has a value (default PENDING).
  outcome: z.enum(INTERVIEW_OUTCOMES).optional(),
  notes: optionalText(5000),
});

export const createInterviewSchema = interviewFields;

export const updateInterviewSchema = interviewFields.partial().refine(...notEmpty);

// GET /interviews/upcoming?days=7
export const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});
