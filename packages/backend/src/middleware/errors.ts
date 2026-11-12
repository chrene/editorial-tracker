import type { NextFunction, Request, Response } from 'express';
import { isHttpError } from 'http-errors';

/**
 * The one place a failure becomes a status code. Services throw `http-errors`
 * (`createError.NotFound()`, `createError.Conflict(...)`); anything else is a
 * bug, so it is logged and reported as a 500 rather than leaked to the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isHttpError(err) && err.expose) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}
