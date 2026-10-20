import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { updateInterviewSchema, upcomingQuerySchema } from '../validators/interviews.js';
import * as interviewController from '../controllers/interviewController.js';

// Routes for one interview by its own id. Listing and creating go through
// the parent application (/applications/:id/interviews, in applications.js).
export const interviewsRouter = Router();

interviewsRouter.use(requireAuth);

// Before /:interviewId, so "upcoming" is never read as an id.
interviewsRouter.get('/upcoming', validate(upcomingQuerySchema, 'query'), interviewController.upcoming);
interviewsRouter.patch('/:interviewId', validate(updateInterviewSchema), interviewController.update);
interviewsRouter.delete('/:interviewId', interviewController.remove);
