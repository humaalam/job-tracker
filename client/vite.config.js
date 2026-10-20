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
});
