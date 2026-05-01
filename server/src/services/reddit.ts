import logger from '../utils/logger';

// meme-api.com is a free service that fetches Reddit posts.
// Unlike direct Reddit requests, it works reliably from cloud servers.
const MEME_API_URL = 'https://meme-api.com/gimme/CryptoCurrency';

export interface CryptoMeme {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
  score: number;
  subreddit: string;
}

interface MemeApiResponse {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  ups: number;
  preview: string[];
}

/**
 * Fetches a fresh random crypto meme on every call via meme-api.com.
 * No caching — each dashboard load gets a different meme.
 */
export async function getMeme(): Promise<CryptoMeme> {
  try {
    logger.debug('Fetching meme from meme-api.com');

    const response = await fetch(MEME_API_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      logger.warn('meme-api.com failed, using static fallback', { status: response.status });
      return getStaticFallback();
    }

    const data = (await response.json()) as MemeApiResponse;

    return {
      id: data.postLink,
      title: data.title,
      imageUrl: data.url,
      postUrl: data.postLink,
      score: data.ups,
      subreddit: data.subreddit,
    };
  } catch (err) {
    logger.warn('meme-api.com error, using static fallback', { error: (err as Error).message });
    return getStaticFallback();
  }
}

// ── Static fallback pool ───────────────────────────────────────────────────────

const FALLBACK_MEMES: CryptoMeme[] = [
  {
    id: 'fallback-1',
    title: 'When BTC is down but you bought the dip',
    imageUrl: 'https://i.imgflip.com/5q7n7n.png',
    postUrl: 'https://reddit.com/r/CryptoCurrency',
    score: 9999,
    subreddit: 'CryptoCurrency',
  },
  {
    id: 'fallback-2',
    title: 'Me checking my portfolio every 5 minutes',
    imageUrl: 'https://i.imgflip.com/7xkwxr.png',
    postUrl: 'https://reddit.com/r/CryptoCurrency',
    score: 8888,
    subreddit: 'CryptoCurrency',
  },
  {
    id: 'fallback-3',
    title: 'HODLing through the bear market like',
    imageUrl: 'https://i.imgflip.com/61yfbu.png',
    postUrl: 'https://reddit.com/r/CryptoCurrency',
    score: 7777,
    subreddit: 'CryptoCurrency',
  },
];

function getStaticFallback(): CryptoMeme {
  return FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)];
}
