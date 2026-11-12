import { Router } from 'express';
import * as content from '../services/content.js';
import { parseCreate, parseStatus, parseUpdate } from '../validation.js';

export const contentRouter = Router();

contentRouter.get('/', async (req, res) => {
  res.json(await content.list(req.user));
});

contentRouter.get('/:id', async (req, res) => {
  res.json(await content.get(req.user, req.params.id));
});

contentRouter.get('/:id/audit', async (req, res) => {
  res.json(await content.history(req.user, req.params.id));
});

contentRouter.post('/', async (req, res) => {
  res.status(201).json(await content.create(req.user, parseCreate(req.body)));
});

contentRouter.patch('/:id', async (req, res) => {
  res.json(await content.update(req.user, req.params.id, parseUpdate(req.body)));
});

contentRouter.patch('/:id/status', async (req, res) => {
  res.json(await content.updateStatus(req.user, req.params.id, parseStatus(req.body)));
});

contentRouter.delete('/:id', async (req, res) => {
  await content.remove(req.user, req.params.id);
  res.status(204).end();
});
