import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { statsQuerySchema } from '../validators/dashboard.js';
import * as dashboardController from '../controllers/dashboardController.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', validate(statsQuerySchema, 'query'), dashboardController.stats);
