import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { requireAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.use(requireAuth);

// ── Validation schema ─────────────────────────────────────────────────────────

const voteSchema = z.object({
  section: z.enum(['prices', 'news', 'ai_insight', 'meme']),
  contentId: z.string().min(1),
  vote: z.enum(['up', 'down']),
});

// ── POST /votes ───────────────────────────────────────────────────────────────
// Submits a thumbs-up or thumbs-down for a content item.
// If the user already voted on that item, the vote is updated (toggle behaviour).

router.post('/', async (req: Request, res: Response) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { section, contentId, vote } = parsed.data;
  const userId = req.user!.userId;

  try {
    const result = await prisma.vote.upsert({
      where: {
        // The unique constraint on (userId, section, contentId) ensures one vote per item.
        userId_section_contentId: { userId, section, contentId },
      },
      create: { userId, section, contentId, vote },
      update: { vote },
    });

    logger.info('Vote recorded', { userId, section, contentId, vote });

    res.json({ vote: result });
  } catch (err) {
    logger.error('POST /votes error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /votes/me ─────────────────────────────────────────────────────────────
// Returns all votes by the current user (useful for displaying historical feedback).

router.get('/me', async (req: Request, res: Response) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ votes });
  } catch (err) {
    logger.error('GET /votes/me error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
