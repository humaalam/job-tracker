import { z } from 'zod';
import { HttpError } from '../utils/httpError.js';

// Checks req.body (or req.query) against a zod schema. On success, it is
// replaced by the parsed data (trimmed, lowercased, defaults filled in,
// unknown fields removed).
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new HttpError(400, 'Validation failed', z.flattenError(result.error)));
    }
    // In Express 5, req.query is a read-only getter, so a plain assignment
    // fails. defineProperty puts our value on this request object instead.
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    next();
  };
}
