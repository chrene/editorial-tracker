import express from 'express';

import './schema-contract.js';
import { mockAuth } from './auth.js';
import { errorHandler } from './middleware/errors.js';
import { contentRouter } from './routes/content.js';
import { userRouter } from './routes/users.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/users', userRouter);

app.use('/api', mockAuth);
app.use('/api/content', contentRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});
