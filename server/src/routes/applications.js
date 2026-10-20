import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createApplicationSchema, updateApplicationSchema } from '../validators/applications.js';
import * as applicationController from '../controllers/applicationController.js';

export const applicationsRouter = Router();

// Every route below needs a logged-in user.
applicationsRouter.use(requireAuth);

applicationsRouter.post('/', validate(createApplicationSchema), applicationController.create);
applicationsRouter.get('/', applicationController.list);
applicationsRouter.get('/:id', applicationController.getOne);
applicationsRouter.patch('/:id', validate(updateApplicationSchema), applicationController.update);
applicationsRouter.delete('/:id', applicationController.remove);
