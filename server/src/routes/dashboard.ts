import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { requireAuth } from '../middleware/auth';
import { getPrices } from '../services/coingecko';
import { getNews } from '../services/cryptopanic';
import { getAiInsight } from '../services/openrouter';
import { getMeme } from '../services/reddit';
import logger from '../utils/logger';

const router = Router();

// All dashboard routes require authentication.
router.use(requireAuth);

// ── GET /dashboard ────────────────────────────────────────────────────────────
// Aggregates all four sections in parallel for a single page-load request.
// Each section is fetched independently so a failure in one doesn't block others.

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    // Load the user's preferences to personalise each section.
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      res.status(400).json({ error: 'Preferences not set. Please complete onboarding first.' });
      return;
    }

    logger.debug('Fetching dashboard sections in parallel', { userId });

    // Fetch all sections concurrently; wrap each in a settled result so one
    // failure doesn't crash the whole dashboard.
    const [pricesResult, newsResult, insightResult, memeResult] = await Promise.allSettled([
      getPrices(preferences.cryptoAssets),
      getNews(preferences.cryptoAssets),
      getAiInsight(preferences.cryptoAssets, preferences.investorType),
      getMeme(),
    ]);

    // Extract value or fallback to null for each section.
    const prices  = pricesResult.status  === 'fulfilled' ? pricesResult.value  : null;
    const news    = newsResult.status    === 'fulfilled' ? newsResult.value    : null;
    const insight = insightResult.status === 'fulfilled' ? insightResult.value : null;
    const meme    = memeResult.status    === 'fulfilled' ? memeResult.value    : null;

    // Load the user's existing votes for today so the frontend can pre-fill UI.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const votes = await prisma.vote.findMany({
      where: { userId, createdAt: { gte: todayStart } },
      select: { section: true, contentId: true, vote: true },
    });

    res.json({ prices, news, insight, meme, votes });
  } catch (err) {
    logger.error('GET /dashboard error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
