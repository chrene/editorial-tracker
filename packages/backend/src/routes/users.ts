import { Router } from 'express';
import { USERS } from '@editorial-tracker/shared';

export const userRouter = Router();

/**
 * The hardcoded demo users, so the login screen can offer a "sign in as"
 * picker. Deliberately public: it is needed before anyone is signed in, and it
 * holds no secrets — authentication is mocked.
 */
userRouter.get('/', (_req, res) => res.json(USERS));
