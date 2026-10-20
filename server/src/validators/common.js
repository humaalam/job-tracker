import { z } from 'zod';

// An optional free-text field: trimmed, with a length cap. null clears it on update.
export const optionalText = (max) => z.string().trim().max(max).nullish();

export const requiredText = (label) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(200);

// A link the client shows as clickable: only http(s). Plain z.url() also accepts
// schemes like javascript: or data:, which could run code when clicked.
export const webUrl = () =>
  z.url({ protocol: /^https?$/, error: 'Use a web address starting with http:// or https://' }).nullish();

// For PATCH schemas: every field is optional, but at least one must be sent.
export const notEmpty = [(d) => Object.keys(d).length > 0, { message: 'Send at least one field to update' }];
