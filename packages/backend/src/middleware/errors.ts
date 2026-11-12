import type { NextFunction, Request, Response } from 'express';
import createError, { isHttpError } from 'http-errors';
import { Prisma } from '@prisma/client';

const PRISMA_RECORD_NOT_FOUND = 'P2025';

function isRowDeletedByAnotherRequestBeforeOurWrite(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_RECORD_NOT_FOUND
  );
}

function toHttpError(err: unknown) {
  if (isHttpError(err)) return err;
  if (isRowDeletedByAnotherRequestBeforeOurWrite(err)) return createError.NotFound();
  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const httpError = toHttpError(err);

  if (httpError?.expose) {
    res.status(httpError.status).json({ error: httpError.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}
