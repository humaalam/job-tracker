// Import config first so .env is loaded before any other module runs.
import { config } from './config/env.js';
import { app } from './app.js';
import { prisma } from './db/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

// `docker stop` sends SIGTERM. Finish the requests in progress and close the
// database connections, so the process can exit by itself.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => prisma.$disconnect());
}

// `once`: a second signal falls back to Node's default and exits immediately.
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
