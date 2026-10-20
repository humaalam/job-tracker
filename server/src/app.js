import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { applicationsRouter } from './routes/applications.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds the app without listening, so tests can import it.
export const app = express();

// Parse JSON request bodies into req.body.
app.use(express.json());
// Parse the Cookie header into req.cookies.
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);

// Order matters: routes first, then 404 for anything unmatched, then errors.
app.use(notFound);
app.use(errorHandler);
