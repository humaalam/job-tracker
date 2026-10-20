import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { salaryRangeOk, SALARY_RANGE_MESSAGE } from '../validators/applications.js';

const notFound = () => new HttpError(404, 'Application not found');

// Postgres rejects a non-UUID for a uuid column (that would be a 500), so treat it as not found.
function assertUuid(id) {
  if (!z.uuid().safeParse(id).success) {
    throw notFound();
  }
}

// Finds the user's application or throws 404. Matching on userId too means
// another user's application looks exactly like a missing one, so we don't
// reveal that it exists.
async function findOwnedApplication(userId, id, options = {}) {
  assertUuid(id);
  const application = await prisma.application.findFirst({ where: { id, userId }, ...options });
  if (!application) {
    throw notFound();
  }
  return application;
}

export async function createApplication(userId, data) {
  const { status, ...fields } = data;
  // One nested create = one atomic write: the application and its first
  // history entry are saved together, or not at all.
  return prisma.application.create({
    data: {
      ...fields,
      userId,
      status,
      appliedAt: status === 'APPLIED' ? new Date() : null,
      statusChanges: { create: { fromStatus: null, toStatus: status } },
    },
  });
}

// Filters, sorting and paging are added in Phase 3 step 4.
export async function listApplications(userId) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getApplication(userId, id) {
  return findOwnedApplication(userId, id, {
    include: {
      contacts: { orderBy: { createdAt: 'asc' } },
      interviews: { orderBy: { scheduledAt: 'asc' } },
      statusChanges: { orderBy: { changedAt: 'asc' } },
    },
  });
}

export async function updateApplication(userId, id, data) {
  const existing = await findOwnedApplication(userId, id, {
    select: { salaryMin: true, salaryMax: true },
  });
  // The validator only sees the request body. If just one salary is sent,
  // compare it with the value already saved.
  if (!salaryRangeOk({ ...existing, ...data })) {
    throw new HttpError(400, 'Validation failed', {
      formErrors: [],
      fieldErrors: { salaryMax: [SALARY_RANGE_MESSAGE] },
    });
  }
  return prisma.application.update({ where: { id }, data });
}

export async function deleteApplication(userId, id) {
  assertUuid(id);
  // deleteMany accepts non-unique filters like userId and reports how many
  // rows it removed: 0 means missing or not ours. Contacts, interviews and
  // history are removed by the database (onDelete: Cascade).
  const { count } = await prisma.application.deleteMany({ where: { id, userId } });
  if (count === 0) {
    throw notFound();
  }
}
