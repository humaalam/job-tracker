import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, forward every /api request to the Express server.
    // The browser only ever talks to localhost:5173, so the auth cookie is same-origin.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  // Vitest reads this part, so tests use the same plugins (JSX) as the app.
  test: {
    // jsdom: a browser imitation in Node (document, window, events), so
    // components can render without a real browser.
    environment: 'jsdom',
    // Runs before every test file: adds the DOM matchers and cleans up.
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
