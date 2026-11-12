import type { NextFunction, Request, Response } from 'express';
import createError, { isHttpError } from 'http-errors';
import { Prisma } from '@prisma/client';

/**
 * The one place a failure becomes a status code. Services throw `http-errors`
 * (`createError.NotFound()`, `createError.Conflict(...)`); anything else is a
 * bug, so it is logged and reported as a 500 rather than leaked to the client.
 */

/**
 * The database failures worth answering properly rather than as a 500.
 *
 * Every write first loads the item to check permission, so by the time it runs
 * the row existed. P2025 means someone deleted it in between — a race between
 * two editors, not a bug, and "gone" is the honest answer.
 */
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
