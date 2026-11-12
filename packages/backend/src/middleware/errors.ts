import type { NextFunction, Request, Response } from 'express';
import createError, { isHttpError } from 'http-errors';
import { Prisma } from '@prisma/client';

function fromPrisma(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return createError.NotFound();
  }
  return null;
}
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const mapped = isHttpError(err) ? err : fromPrisma(err);

  if (mapped && mapped.expose) {
    res.status(mapped.status).json({ error: mapped.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}
