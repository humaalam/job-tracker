import express from 'express';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds the app without listening, so tests can import it.
export const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Order matters: routes first, then 404 for anything unmatched, then errors.
app.use(notFound);
app.use(errorHandler);
