import { z } from 'zod';
import { optionalText, requiredText, notEmpty } from './common.js';

const contactFields = z.object({
  name: requiredText('Name'),
  title: optionalText(200),
  // Trim and lowercase first, then check the format (same as the auth email).
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email')).nullish(),
  // Phone formats differ a lot between countries, so only cap the length.
  phone: optionalText(50),
  linkedinUrl: z.url('Invalid URL').nullish(),
  notes: optionalText(5000),
});

export const createContactSchema = contactFields;

export const updateContactSchema = contactFields.partial().refine(...notEmpty);
