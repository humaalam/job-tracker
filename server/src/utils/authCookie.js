import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const AUTH_COOKIE = 'token';

// clearCookie only works if these match the options the cookie was set with.
const cookieOptions = {
  httpOnly: true, // browser JavaScript can't read it (protects against XSS)
  sameSite: 'lax', // not sent on cross-site POSTs (protects against CSRF)
  secure: config.nodeEnv === 'production', // HTTPS only in production
  path: '/',
};

export function setAuthCookie(res, token) {
  // Let the cookie expire at the same moment as the token inside it.
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: new Date(exp * 1000) });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
