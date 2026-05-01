import logger from '../utils/logger';

// meme-api.com works reliably from cloud servers unlike direct Reddit API calls.
const MEME_API_BASE = 'https://meme-api.com/gimme';

// Rotate across multiple crypto subreddits for variety.
const SUBREDDITS = ['cryptomemes', 'ethtrader', 'dogecoin', 'Bitcoin'];

export interface CryptoMeme {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
  score: number;
  subreddit: string;
}

interface MemeApiMeme {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  ups: number;
  nsfw: boolean;
}

interface MemeApiBatchResponse {
  count: number;
  memes: MemeApiMeme[];
}

/**
 * Fetches a random crypto meme from a randomly-chosen subreddit.
 * Requests a batch of 5 and picks one at random for maximum variety.
 */
export async function getMeme(): Promise<CryptoMeme> {
  try {
    // Pick a random subreddit each time.
    const subreddit = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];

    logger.debug('Fetching meme', { subreddit });

    const response = await fetch(`${MEME_API_BASE}/${subreddit}/5`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      logger.warn('meme-api.com failed', { status: response.status });
      return getStaticFallback();
    }

    const data = (await response.json()) as MemeApiBatchResponse;

    if (!data.memes || data.memes.length === 0) {
      return getStaticFallback();
    }

    const meme = data.memes[Math.floor(Math.random() * data.memes.length)];

    return {
      id: meme.postLink,
      title: meme.title,
      imageUrl: meme.url,
      postUrl: meme.postLink,
      score: meme.ups,
      subreddit: meme.subreddit,
    };
  } catch (err) {
    logger.warn('getMeme error, using fallback', { error: (err as Error).message });
    return getStaticFallback();
  }
}

// ── Static fallback pool ───────────────────────────────────────────────────────

const FALLBACK_MEMES: CryptoMeme[] = [
  {
    id: 'fallback-1',
    title: 'When BTC is down but you bought the dip',
    imageUrl: 'https://i.imgflip.com/5q7n7n.png',
    postUrl: 'https://reddit.com/r/cryptomemes',
    score: 9999,
    subreddit: 'cryptomemes',
  },
  {
    id: 'fallback-2',
    title: 'Me checking my portfolio every 5 minutes',
    imageUrl: 'https://i.imgflip.com/7xkwxr.png',
    postUrl: 'https://reddit.com/r/cryptomemes',
    score: 8888,
    subreddit: 'cryptomemes',
  },
  {
    id: 'fallback-3',
    title: 'HODLing through the bear market like',
    imageUrl: 'https://i.imgflip.com/61yfbu.png',
    postUrl: 'https://reddit.com/r/cryptomemes',
    score: 7777,
    subreddit: 'cryptomemes',
  },
];

function getStaticFallback(): CryptoMeme {
  return FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)];
}
