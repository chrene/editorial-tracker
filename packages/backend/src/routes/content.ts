import { Router } from 'express';
import * as content from '../services/content.js';
import { parseCreate, parseStatus, parseUpdate } from '../validation.js';

/**
 * HTTP wiring only: read the request, call a service, pick a status code.
 * Permissions, status transitions and audit writes live in the service; failures
 * are thrown and turned into responses by the error middleware.
 *
 * Every route below is filtered by the caller's role: editors reach all content
 * items, contributors only their own.
 */
export const contentRouter = Router();

/** All content items the caller may see. */
contentRouter.get('/', async (req, res) => {
  res.json(await content.list(req.user));
});

contentRouter.get('/:id', async (req, res) => {
  res.json(await content.get(req.user, req.params.id));
});

/** The full change history for one item. */
contentRouter.get('/:id/audit', async (req, res) => {
  res.json(await content.history(req.user, req.params.id));
});

/** Create a content item. It always starts at status `idea`. */
contentRouter.post('/', async (req, res) => {
  res.status(201).json(await content.create(req.user, parseCreate(req.body)));
});

/** Edit fields. Status is not a field — see the route below. */
contentRouter.patch('/:id', async (req, res) => {
  res.json(await content.update(req.user, req.params.id, parseUpdate(req.body)));
});

/** Move an item to a new status, if the state machine allows it. */
contentRouter.patch('/:id/status', async (req, res) => {
  res.json(await content.updateStatus(req.user, req.params.id, parseStatus(req.body)));
});

contentRouter.delete('/:id', async (req, res) => {
  await content.remove(req.user, req.params.id);
  res.status(204).end();
});
