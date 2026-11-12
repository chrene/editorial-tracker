import express from 'express';
import { mockAuth } from './auth.js';
import { errorHandler } from './middleware/errors.js';
import { contentRouter } from './routes/content.js';
import { userRouter } from './routes/users.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Everything past this point needs an x-user-id header.
app.use('/api', mockAuth);
app.use('/api/users', userRouter);
app.use('/api/content', contentRouter);

// Express 5 forwards rejected promises from async handlers here, so routes
// never need their own try/catch.
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});
