import { z } from 'zod';

export const registerSchema = z.object({
  // Trim and lowercase first, then check the format, so " Me@X.com " is accepted.
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Invalid email')),
  // bcrypt only uses the first 72 bytes of a password, so cap the length.
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
});
