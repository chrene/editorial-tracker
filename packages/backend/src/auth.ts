import type { NextFunction, Request, Response } from 'express';
import { findUser, type User } from '@editorial-tracker/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export function mockAuth(req: Request, res: Response, next: NextFunction): void {
  const id = req.header('x-user-id');
  if (!id) {
    res.status(401).json({ error: 'Missing x-user-id header.' });
    return;
  }
  const user = findUser(id);
  if (!user) {
    res.status(401).json({ error: `Unknown user '${id}'.` });
    return;
  }
  req.user = user;
  next();
}
