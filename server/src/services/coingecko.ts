import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

// Binance public API — no key required, no cloud-IP rate limiting.
const BINANCE_URL = 'https://api.binance.com/api/v3/ticker/24hr';

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

const TICKER_META: Record<string, { name: string; binanceSymbol: string; image: string }> = {
  BTC: {
    name: 'Bitcoin',
    binanceSymbol: 'BTCUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  ETH: {
    name: 'Ethereum',
    binanceSymbol: 'ETHUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  },
  SOL: {
    name: 'Solana',
    binanceSymbol: 'SOLUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
  },
  BNB: {
    name: 'BNB',
    binanceSymbol: 'BNBUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  },
  XRP: {
    name: 'XRP',
    binanceSymbol: 'XRPUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  },
  DOGE: {
    name: 'Dogecoin',
    binanceSymbol: 'DOGEUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png',
  },
  ADA: {
    name: 'Cardano',
    binanceSymbol: 'ADAUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
  },
  AVAX: {
    name: 'Avalanche',
    binanceSymbol: 'AVAXUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  },
  MATIC: {
    name: 'Polygon',
    binanceSymbol: 'MATICUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  },
  DOT: {
    name: 'Polkadot',
    binanceSymbol: 'DOTUSDT',
    image: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png',
  },
};

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

export async function getPrices(tickers: string[]): Promise<CoinPrice[]> {
  const validTickers = tickers.map((t) => t.toUpperCase()).filter((t) => TICKER_META[t]);

  if (validTickers.length === 0) return [];

  const cacheKey = `coins:${validTickers.join(',')}`;
  const cached = await getCached<CoinPrice[]>(Section.prices, cacheKey);
  if (cached) return cached;

  const symbols = JSON.stringify(validTickers.map((t) => TICKER_META[t].binanceSymbol));
  const url = `${BINANCE_URL}?symbols=${encodeURIComponent(symbols)}`;

  logger.debug('Fetching coin prices from Binance', { tickers: validTickers.join(',') });

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
  }

  const raw = (await response.json()) as BinanceTicker[];

  const data: CoinPrice[] = raw.map((item) => {
    const ticker = validTickers.find((t) => TICKER_META[t].binanceSymbol === item.symbol)!;
    const meta = TICKER_META[ticker];
    return {
      id: ticker.toLowerCase(),
      symbol: ticker.toLowerCase(),
      name: meta.name,
      current_price: parseFloat(item.lastPrice),
      price_change_percentage_24h: parseFloat(item.priceChangePercent),
      market_cap: 0,
      image: meta.image,
    };
  });

  await setCached(Section.prices, cacheKey, data, CACHE_TTL_SECONDS);

  return data;
}
