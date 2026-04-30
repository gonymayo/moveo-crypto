import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

const BASE_URL = process.env.REDDIT_BASE_URL ?? 'https://www.reddit.com';

// Cache memes for 30 minutes — they're fun but not urgent.
const CACHE_TTL_SECONDS = 30 * 60;

export interface CryptoMeme {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
  score: number;
  subreddit: string;
}

/**
 * Fetches a random crypto meme from Reddit's JSON API.
 * No authentication required — Reddit exposes public subreddits as JSON.
 * Returns a random entry from the top 10 image posts.
 */
export async function getMeme(): Promise<CryptoMeme> {
  const cacheKey = 'memes:top10';
  let memes = await getCached<CryptoMeme[]>(Section.meme, cacheKey);

  if (!memes) {
    logger.debug('Fetching memes from Reddit');

    const response = await fetch(
      `${BASE_URL}/r/CryptoCurrency/hot.json?limit=25`,
      {
        headers: {
          // Reddit requires a non-browser User-Agent to avoid 429s.
          'User-Agent': 'MoveoBot/1.0 (crypto advisor app)',
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      logger.warn('Reddit API failed, using static fallback meme');
      return getStaticFallback();
    }

    const json = (await response.json()) as RedditResponse;

    // Filter to image posts only (jpg/png) and extract the fields we need.
    memes = json.data.children
      .filter(
        (child) =>
          child.data.post_hint === 'image' &&
          !child.data.over_18 &&
          (child.data.url.endsWith('.jpg') || child.data.url.endsWith('.png')),
      )
      .slice(0, 10)
      .map((child) => ({
        id: child.data.id,
        title: child.data.title,
        imageUrl: child.data.url,
        postUrl: `https://reddit.com${child.data.permalink}`,
        score: child.data.score,
        subreddit: child.data.subreddit,
      }));

    if (memes.length === 0) {
      logger.warn('No image memes found on Reddit, using static fallback');
      return getStaticFallback();
    }

    await setCached(Section.meme, cacheKey, memes, CACHE_TTL_SECONDS);
  }

  // Return a random meme from the cached list for variety on each load.
  const randomIndex = Math.floor(Math.random() * memes.length);
  return memes[randomIndex];
}

// ── Static fallback ───────────────────────────────────────────────────────────

function getStaticFallback(): CryptoMeme {
  return {
    id: 'fallback',
    title: 'When BTC is down but you bought the dip',
    imageUrl: 'https://i.imgflip.com/5q7n7n.png',
    postUrl: 'https://reddit.com/r/CryptoCurrency',
    score: 9999,
    subreddit: 'CryptoCurrency',
  };
}

// ── Reddit API types ──────────────────────────────────────────────────────────

interface RedditResponse {
  data: {
    children: {
      data: {
        id: string;
        title: string;
        url: string;
        permalink: string;
        score: number;
        subreddit: string;
        post_hint?: string;
        over_18: boolean;
      };
    }[];
  };
}
