import { defineConfig } from 'prisma/config';
// Our config loads the repo-root .env (Prisma 7 does not load .env itself).
import { config } from './src/config/env.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: config.databaseUrl },
});
