import { z } from 'zod';

// A time zone name like "Europe/Berlin" or "UTC". The regex rules out offsets
// like "+05:00": Postgres reads those with the opposite sign. Intl then
// checks the name really exists.
const isTimeZone = (tz) => {
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(tz)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// GET /dashboard/stats?tz=Europe/Berlin
export const statsQuerySchema = z.object({
  tz: z.string().trim().refine(isTimeZone, 'Unknown time zone, use a name like Europe/Berlin').default('UTC'),
});
