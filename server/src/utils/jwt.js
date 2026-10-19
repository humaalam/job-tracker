import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { HttpError } from './httpError.js';

// "sub" (subject) is the standard JWT field for "who this token is about".
export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// Returns the user id, or throws 401 if the token is forged, broken or expired.
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    return payload.sub;
  } catch {
    throw new HttpError(401, 'Not authenticated');
  }
}
