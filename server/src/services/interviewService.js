import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { isUuid } from '../utils/isUuid.js';
import { findOwnedApplication } from './applicationService.js';

const notFound = () => new HttpError(404, 'Interview not found');

// An interview has no userId of its own: it belongs to the user who owns its
// application. This `where` matches only interviews the user owns.
const ownedBy = (userId, id) => ({ id, application: { userId } });

function assertUuid(id) {
  if (!isUuid(id)) {
    throw notFound();
  }
}

export async function listInterviews(userId, applicationId) {
  const { interviews } = await findOwnedApplication(prisma, userId, applicationId, {
    select: { interviews: { orderBy: { scheduledAt: 'asc' } } },
  });
  return interviews;
}

export async function createInterview(userId, applicationId, data) {
  // Throws 404 if the application is missing or not ours.
  await findOwnedApplication(prisma, userId, applicationId, { select: { id: true } });
  return prisma.interview.create({ data: { ...data, applicationId } });
}

export async function updateInterview(userId, id, data) {
  assertUuid(id);
  // updateMany accepts the ownership filter; count 0 means missing or not ours.
  const { count } = await prisma.interview.updateMany({ where: ownedBy(userId, id), data });
  if (count === 0) {
    throw notFound();
  }
  return prisma.interview.findUnique({ where: { id } });
}

export async function deleteInterview(userId, id) {
  assertUuid(id);
  const { count } = await prisma.interview.deleteMany({ where: ownedBy(userId, id) });
  if (count === 0) {
    throw notFound();
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Interviews from now until `days` days from now, soonest first. Cancelled
// ones are left out. Each includes a short summary of its application, so a
// list can show "Globex: Full-Stack Engineer" without another request.
// Also used by the dashboard stats (Phase 5).
export async function listUpcomingInterviews(userId, days) {
  const now = new Date();
  return prisma.interview.findMany({
    where: {
      application: { userId },
      scheduledAt: { gte: now, lt: new Date(now.getTime() + days * DAY_MS) },
      outcome: { not: 'CANCELLED' },
    },
    orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    include: { application: { select: { id: true, company: true, roleTitle: true, status: true } } },
  });
}
