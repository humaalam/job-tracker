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
// reveal that it exists. `db` is prisma, or `tx` inside a transaction.
async function findOwnedApplication(db, userId, id, options = {}) {
  assertUuid(id);
  const application = await db.application.findFirst({ where: { id, userId }, ...options });
  if (!application) {
    throw notFound();
  }
  return application;
}

// The fields applyStatusChange needs to know about the current state.
const statusFields = { id: true, status: true, appliedAt: true };

// THE place where a status changes. Every caller runs it inside a transaction
// (`tx`), so the new status and its history row are saved together or not at all.
async function applyStatusChange(tx, application, toStatus) {
  if (application.status === toStatus) {
    return; // Nothing changed, so no history row.
  }
  // The `status` condition makes this update fail if another request changed
  // the status after we read it. Without it, the history could record a wrong fromStatus.
  const { count } = await tx.application.updateMany({
    where: { id: application.id, status: application.status },
    data: {
      status: toStatus,
      // appliedAt is the date of the FIRST move to APPLIED, so never overwrite it.
      ...(toStatus === 'APPLIED' && !application.appliedAt && { appliedAt: new Date() }),
    },
  });
  if (count === 0) {
    throw new HttpError(409, 'The status was changed by another request. Reload and try again.');
  }
  await tx.statusChange.create({
    data: { applicationId: application.id, fromStatus: application.status, toStatus },
  });
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
  return findOwnedApplication(prisma, userId, id, {
    include: {
      contacts: { orderBy: { createdAt: 'asc' } },
      interviews: { orderBy: { scheduledAt: 'asc' } },
      statusChanges: { orderBy: { changedAt: 'asc' } },
    },
  });
}

export async function updateApplication(userId, id, data) {
  const { status, ...fields } = data;
  // An interactive transaction: if any step throws, everything is rolled back.
  return prisma.$transaction(async (tx) => {
    const existing = await findOwnedApplication(tx, userId, id, {
      select: { ...statusFields, salaryMin: true, salaryMax: true },
    });
    // The validator only sees the request body. If just one salary is sent,
    // compare it with the value already saved.
    if (!salaryRangeOk({ ...existing, ...fields })) {
      throw new HttpError(400, 'Validation failed', {
        formErrors: [],
        fieldErrors: { salaryMax: [SALARY_RANGE_MESSAGE] },
      });
    }
    if (Object.keys(fields).length > 0) {
      await tx.application.update({ where: { id }, data: fields });
    }
    if (status) {
      await applyStatusChange(tx, existing, status);
    }
    return tx.application.findUnique({ where: { id } });
  });
}

export async function changeStatus(userId, id, status) {
  return prisma.$transaction(async (tx) => {
    const existing = await findOwnedApplication(tx, userId, id, { select: statusFields });
    await applyStatusChange(tx, existing, status);
    return tx.application.findUnique({ where: { id } });
  });
}

export async function getStatusHistory(userId, id) {
  const { statusChanges } = await findOwnedApplication(prisma, userId, id, {
    select: { statusChanges: { orderBy: { changedAt: 'asc' } } },
  });
  return statusChanges;
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
