import { prisma } from '../../src/db/prisma.js';

// Wipe all data so each test starts from an empty database.
// Deleting users is enough: everything else is removed by cascade.
export async function resetDb() {
  await prisma.user.deleteMany();
}

export { prisma };
