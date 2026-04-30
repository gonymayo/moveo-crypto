import Parser from 'rss-parser';
import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

// CoinTelegraph RSS — completely free, no API key needed.
const RSS_URL = 'https://cointelegraph.com/rss';

const CACHE_TTL_SECONDS = 15 * 60;

const parser = new Parser();

export interface NewsArticle {
  id: number;
  title: string;
  url: string;
  source: { title: string; domain: string };
  published_at: string;
  currencies?: { code: string; title: string }[];
}

/**
 * Fetches the latest crypto news from CoinTelegraph RSS feed.
 * No API key required.
 */
export async function getNews(tickers: string[]): Promise<NewsArticle[]> {
  const cacheKey = `news:rss`;
  const cached = await getCached<NewsArticle[]>(Section.news, cacheKey);
  if (cached) return cached;

  logger.debug('Fetching news from CoinTelegraph RSS');

  const feed = await parser.parseURL(RSS_URL);

  if (!feed.items || feed.items.length === 0) {
    logger.warn('CoinTelegraph RSS returned no items, using fallback');
    return STATIC_FALLBACK;
  }

  const articles: NewsArticle[] = feed.items.slice(0, 5).map((item, i) => ({
    id: i + 1,
    title: item.title ?? 'No title',
    url: item.link ?? RSS_URL,
    source: { title: 'CoinTelegraph', domain: 'cointelegraph.com' },
    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    currencies: tickers.map((code) => ({ code, title: code })),
  }));

  await setCached(Section.news, cacheKey, articles, CACHE_TTL_SECONDS);

  return articles;
}

// ── Static fallback ───────────────────────────────────────────────────────────

const STATIC_FALLBACK: NewsArticle[] = [
  {
    id: 1,
    title: 'Bitcoin hits new highs as institutional demand surges',
    url: 'https://cointelegraph.com',
    source: { title: 'CoinTelegraph', domain: 'cointelegraph.com' },
    published_at: new Date().toISOString(),
    currencies: [{ code: 'BTC', title: 'Bitcoin' }],
  },
  {
    id: 2,
    title: 'Ethereum staking rewards reach all-time high',
    url: 'https://cointelegraph.com',
    source: { title: 'CoinTelegraph', domain: 'cointelegraph.com' },
    published_at: new Date().toISOString(),
    currencies: [{ code: 'ETH', title: 'Ethereum' }],
  },
  {
    id: 3,
    title: 'Solana DeFi TVL breaks $10B milestone',
    url: 'https://cointelegraph.com',
    source: { title: 'CoinTelegraph', domain: 'cointelegraph.com' },
    published_at: new Date().toISOString(),
    currencies: [{ code: 'SOL', title: 'Solana' }],
  },
];
