import { Router } from 'express';
import { USERS } from '@editorial-tracker/shared';

export const userRouter = Router();

/** The hardcoded user list, so the frontend can offer a "sign in as" picker. */
userRouter.get('/', (_req, res) => res.json(USERS));

userRouter.get('/me', (req, res) => res.json(req.user));
