import apiClient from './client';

// ── Types matching the backend responses ──────────────────────────────────────

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  url: string;
  source: { title: string; domain: string };
  published_at: string;
  currencies?: { code: string; title: string }[];
}

export interface AiInsight {
  text: string;
  model: string;
  generatedAt: string;
}

export interface CryptoMeme {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
  score: number;
  subreddit: string;
}

export interface VoteSummary {
  section: string;
  contentId: string;
  vote: 'up' | 'down';
}

export interface DashboardData {
  prices: CoinPrice[] | null;
  news: NewsArticle[] | null;
  insight: AiInsight | null;
  meme: CryptoMeme | null;
  votes: VoteSummary[];
}

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const res = await apiClient.get<DashboardData>('/dashboard');
    return res.data;
  },
};

export const onboardingApi = {
  savePreferences: async (data: {
    cryptoAssets: string[];
    investorType: string;
    contentTypes: string[];
  }): Promise<void> => {
    await apiClient.post('/onboarding/preferences', data);
  },
};
