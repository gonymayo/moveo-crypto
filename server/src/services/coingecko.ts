import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

const BASE_URL = process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3';

// Cache coin prices for 5 minutes to respect the free-tier rate limit (30 req/min).
const CACHE_TTL_SECONDS = 5 * 60;

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

/**
 * Maps user-friendly ticker symbols (e.g. "BTC") to CoinGecko coin IDs.
 * CoinGecko uses slugs like "bitcoin", not tickers.
 */
const TICKER_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
};

/**
 * Fetches live prices for the user's chosen crypto assets.
 * Results are cached per coin set to avoid hammering the free-tier limit.
 */
export async function getPrices(tickers: string[]): Promise<CoinPrice[]> {
  const coinIds = tickers
    .map((t) => TICKER_TO_ID[t.toUpperCase()])
    .filter(Boolean)
    .join(',');

  const cacheKey = `coins:${coinIds}`;
  const cached = await getCached<CoinPrice[]>(Section.prices, cacheKey);
  if (cached) return cached;

  const url =
    `${BASE_URL}/coins/markets` +
    `?vs_currency=usd` +
    `&ids=${coinIds}` +
    `&order=market_cap_desc` +
    `&per_page=20` +
    `&page=1` +
    `&sparkline=false` +
    `&price_change_percentage=24h`;

  logger.debug('Fetching coin prices from CoinGecko', { coinIds });

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as CoinPrice[];

  await setCached(Section.prices, cacheKey, data, CACHE_TTL_SECONDS);

  return data;
}
