import { execSync } from 'node:child_process';

// Apply all migrations to the test database before the tests start.
// NODE_ENV=test makes prisma.config.js (via config/env.js) use TEST_DATABASE_URL.
export default function setup() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
}
