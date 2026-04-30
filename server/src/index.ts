import 'dotenv/config'; // Must be first — loads .env before any other imports.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

import logger from './utils/logger';
import authRouter from './routes/auth';
import onboardingRouter from './routes/onboarding';
import dashboardRouter from './routes/dashboard';
import votesRouter from './routes/votes';

// ── Prisma client (singleton) ────────────────────────────────────────────────
// We export it so route handlers can import it directly without re-instantiating.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ?? 3000;

// Parse allowed origins from the environment variable.
// Falls back to localhost for development.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) in development.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  }),
);

// HTTP request logging via morgan, piped through our Winston logger.
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
// Used by Render's health check pings and local smoke tests.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/onboarding', onboardingRouter);
app.use('/dashboard', dashboardRouter);
app.use('/votes', votesRouter);

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// Must have 4 parameters so Express recognises it as an error handler.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify the database connection before accepting traffic.
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

start();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Closes the DB connection when the process is killed (e.g. Ctrl+C or Render restart).
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
