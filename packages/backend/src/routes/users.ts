import { Router } from 'express';
import { USERS } from '@editorial-tracker/shared';

export const userRouter = Router();

userRouter.get('/', (_req, res) => res.json(USERS));
