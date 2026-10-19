import express from 'express';
import { authRouter } from './routes/auth.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds the app without listening, so tests can import it.
export const app = express();

// Parse JSON request bodies into req.body.
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

// Order matters: routes first, then 404 for anything unmatched, then errors.
app.use(notFound);
app.use(errorHandler);
