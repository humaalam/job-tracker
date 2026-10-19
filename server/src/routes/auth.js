import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { registerSchema } from '../validators/auth.js';
import * as authController from '../controllers/authController.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
