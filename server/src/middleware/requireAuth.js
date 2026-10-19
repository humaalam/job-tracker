import { AUTH_COOKIE } from '../utils/authCookie.js';
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

// Put this in front of any route that needs a logged-in user.
// On success, the user's id is available as req.userId.
export function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE];
  if (!token) {
    throw new HttpError(401, 'Not authenticated');
  }
  req.userId = verifyToken(token);
  next();
}
