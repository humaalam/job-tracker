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

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUserFields, passwordHash: true },
  });
  const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));
  // Same message for "no such user" and "wrong password", so the response
  // doesn't reveal which emails are registered.
  if (!passwordOk) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// Used by /me: the token can outlive the user (e.g. account deleted).
export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserFields });
  if (!user) {
    throw new HttpError(401, 'Not authenticated');
  }
  return user;
}
