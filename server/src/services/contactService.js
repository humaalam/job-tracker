import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { isUuid } from '../utils/isUuid.js';
import { findOwnedApplication } from './applicationService.js';

const notFound = () => new HttpError(404, 'Contact not found');

// Like interviews, a contact belongs to the user who owns its application.
const ownedBy = (userId, id) => ({ id, application: { userId } });

function assertUuid(id) {
  if (!isUuid(id)) {
    throw notFound();
  }
}

export async function listContacts(userId, applicationId) {
  const { contacts } = await findOwnedApplication(prisma, userId, applicationId, {
    select: { contacts: { orderBy: { createdAt: 'asc' } } },
  });
  return contacts;
}

export async function createContact(userId, applicationId, data) {
  // Throws 404 if the application is missing or not ours.
  await findOwnedApplication(prisma, userId, applicationId, { select: { id: true } });
  return prisma.contact.create({ data: { ...data, applicationId } });
}

export async function updateContact(userId, id, data) {
  assertUuid(id);
  // updateMany accepts the ownership filter; count 0 means missing or not ours.
  const { count } = await prisma.contact.updateMany({ where: ownedBy(userId, id), data });
  if (count === 0) {
    throw notFound();
  }
  return prisma.contact.findUnique({ where: { id } });
}

export async function deleteContact(userId, id) {
  assertUuid(id);
  const { count } = await prisma.contact.deleteMany({ where: ownedBy(userId, id) });
  if (count === 0) {
    throw notFound();
  }
}
