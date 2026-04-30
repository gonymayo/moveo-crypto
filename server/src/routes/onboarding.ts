import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { requireAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// All onboarding routes require a valid JWT.
router.use(requireAuth);

// ── Validation schema ─────────────────────────────────────────────────────────

const preferencesSchema = z.object({
  // At least one crypto asset must be selected.
  cryptoAssets: z
    .array(z.string().min(1))
    .min(1, 'Select at least one crypto asset'),

  investorType: z.enum(['HODLer', 'DayTrader', 'NFTCollector', 'CuriousBeginner']),

  // At least one content type must be selected.
  contentTypes: z
    .array(z.enum(['MarketNews', 'Charts', 'Social', 'Fun']))
    .min(1, 'Select at least one content type'),
});

// ── POST /onboarding/preferences ─────────────────────────────────────────────
// Saves the quiz answers and marks the user as having completed onboarding.

router.post('/preferences', async (req: Request, res: Response) => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { cryptoAssets, investorType, contentTypes } = parsed.data;
  const userId = req.user!.userId;

  try {
    // Upsert — allows users to update their preferences later if needed.
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, cryptoAssets, investorType, contentTypes },
      update: { cryptoAssets, investorType, contentTypes },
    });

    // Mark onboarding as complete so the frontend stops redirecting.
    await prisma.user.update({
      where: { id: userId },
      data: { preferencesSet: true },
    });

    logger.info('User preferences saved', { userId, investorType });

    res.json({ preferences });
  } catch (err) {
    logger.error('POST /onboarding/preferences error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /onboarding/preferences ──────────────────────────────────────────────
// Returns the current user's saved preferences (useful for an "edit prefs" page).

router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!preferences) {
      res.status(404).json({ error: 'No preferences found' });
      return;
    }

    res.json({ preferences });
  } catch (err) {
    logger.error('GET /onboarding/preferences error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
