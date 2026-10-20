import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  statusSchema,
  listQuerySchema,
} from '../validators/applications.js';
import { createInterviewSchema } from '../validators/interviews.js';
import { createContactSchema } from '../validators/contacts.js';
import * as applicationController from '../controllers/applicationController.js';
import * as interviewController from '../controllers/interviewController.js';
import * as contactController from '../controllers/contactController.js';

export const applicationsRouter = Router();

// Every route below needs a logged-in user.
applicationsRouter.use(requireAuth);

applicationsRouter.post('/', validate(createApplicationSchema), applicationController.create);
applicationsRouter.get('/', validate(listQuerySchema, 'query'), applicationController.list);
applicationsRouter.get('/:id', applicationController.getOne);
applicationsRouter.patch('/:id', validate(updateApplicationSchema), applicationController.update);
applicationsRouter.delete('/:id', applicationController.remove);
applicationsRouter.patch('/:id/status', validate(statusSchema), applicationController.changeStatus);
applicationsRouter.get('/:id/history', applicationController.history);

// An application's interviews.
applicationsRouter.get('/:id/interviews', interviewController.list);
applicationsRouter.post('/:id/interviews', validate(createInterviewSchema), interviewController.create);

// An application's contacts.
applicationsRouter.get('/:id/contacts', contactController.list);
applicationsRouter.post('/:id/contacts', validate(createContactSchema), contactController.create);
