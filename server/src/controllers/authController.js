import * as authService from '../services/authService.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { AUTH_COOKIE, setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';
import { HttpError } from '../utils/httpError.js';

export async function register(req, res) {
  const user = await authService.register(req.body);
  setAuthCookie(res, signToken(user.id));
  res.status(201).json({ user });
}

export async function login(req, res) {
  const user = await authService.login(req.body);
  setAuthCookie(res, signToken(user.id));
  res.json({ user });
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

// Reads the cookie itself for now; step 4 moves this into requireAuth middleware.
export async function me(req, res) {
  const token = req.cookies[AUTH_COOKIE];
  if (!token) {
    throw new HttpError(401, 'Not authenticated');
  }
  const userId = verifyToken(token);
  const user = await authService.getUserById(userId);
  res.json({ user });
}
