import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

const BASE_URL = process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3';
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

export async function getPrices(tickers: string[]): Promise<CoinPrice[]> {
  const validTickers = tickers.map((t) => t.toUpperCase()).filter((t) => TICKER_TO_ID[t]);

  if (validTickers.length === 0) return [];

  const coinIds = validTickers.map((t) => TICKER_TO_ID[t]).join(',');
  const cacheKey = `coins:${coinIds}`;

  const cached = await getCached<CoinPrice[]>(Section.prices, cacheKey);
  if (cached) return cached;

  logger.debug('Fetching coin prices from CoinGecko', { coinIds });

  const apiKey = process.env.COINGECKO_API_KEY;
  const url = new URL(`${BASE_URL}/coins/markets`);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('ids', coinIds);
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', '20');
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as CoinPrice[];
  await setCached(Section.prices, cacheKey, data, CACHE_TTL_SECONDS);

  return data;
}
