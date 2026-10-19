import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Set before any test file loads, so config/env.js picks TEST_DATABASE_URL.
    env: { NODE_ENV: 'test' },
    // Runs once before all tests: brings the test database up to date.
    globalSetup: './tests/globalSetup.js',
    include: ['tests/**/*.test.js'],
    // All test files share one database, so run them one at a time.
    fileParallelism: false,
  },
});
