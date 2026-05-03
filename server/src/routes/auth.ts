import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── POST /auth/register ───────────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  // 1. Validate request body.
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, name, password } = parsed.data;

  try {
    // 2. Check if the email is already taken.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    // 3. Hash the password and create the user.
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, preferencesSet: true },
    });

    // 4. Issue a JWT.
    const token = signToken({ userId: user.id });

    logger.info('New user registered', { userId: user.id });

    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('Register error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = parsed.data;

  try {
    // 1. Find the user by email.
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, preferencesSet: true },
    });

    // Use a generic error message to prevent user enumeration attacks.
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 2. Issue a JWT.
    const token = signToken({ userId: user.id });

    logger.info('User logged in', { userId: user.id });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferencesSet: user.preferencesSet,
      },
    });
  } catch (err) {
    logger.error('Login error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────
// Returns the current user's profile. Used by the frontend on page load
// to rehydrate auth state from a stored JWT.

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, preferencesSet: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    logger.error('GET /auth/me error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
