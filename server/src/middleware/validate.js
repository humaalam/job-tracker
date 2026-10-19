import { z } from 'zod';
import { HttpError } from '../utils/httpError.js';

// Checks req.body against a zod schema. On success, req.body is replaced by
// the parsed data (trimmed, lowercased, unknown fields removed).
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(400, 'Validation failed', z.flattenError(result.error)));
    }
    req.body = result.data;
    next();
  };
}
