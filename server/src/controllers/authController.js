import * as authService from '../services/authService.js';
import { signToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';

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

// requireAuth runs first and sets req.userId.
export async function me(req, res) {
  const user = await authService.getUserById(req.userId);
  res.json({ user });
}
