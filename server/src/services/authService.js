import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';

// Cost factor: each +1 doubles the time needed to hash (and to brute-force).
const SALT_ROUNDS = 10;

// The user fields that are safe to send to the client (never passwordHash).
const publicUserFields = { id: true, email: true, name: true, createdAt: true };

export async function register({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    return await prisma.user.create({
      data: { email, passwordHash, name },
      select: publicUserFields,
    });
  } catch (err) {
    // P2002 = unique constraint failed, i.e. the email is already registered.
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Email is already registered');
    }
    throw err;
  }
}
