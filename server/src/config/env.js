import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env in development. In production (Docker) there is no
// .env file; variables come from the environment instead.
const envPath = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT: "${process.env.PORT}"`);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
};
