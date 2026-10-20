import { z } from 'zod';

// Postgres rejects a non-UUID for a uuid column (that would be a 500), so
// services check ids with this first and answer 404 instead.
export const isUuid = (id) => z.uuid().safeParse(id).success;
