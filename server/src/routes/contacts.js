import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { updateContactSchema } from '../validators/contacts.js';
import * as contactController from '../controllers/contactController.js';

// Routes for one contact by its own id. Listing and creating go through
// the parent application (/applications/:id/contacts, in applications.js).
export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.patch('/:contactId', validate(updateContactSchema), contactController.update);
contactsRouter.delete('/:contactId', contactController.remove);
