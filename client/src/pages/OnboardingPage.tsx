import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { onboardingApi } from '@/api/dashboard';

// ── Options ───────────────────────────────────────────────────────────────────

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'MATIC', 'DOT'];

const INVESTOR_TYPES = [
  { value: 'HODLer', label: 'HODLer', description: 'Buy and hold for the long term' },
  { value: 'DayTrader', label: 'Day Trader', description: 'Active trading, watching charts daily' },
  { value: 'NFTCollector', label: 'NFT Collector', description: 'Focused on digital art and collectibles' },
  { value: 'CuriousBeginner', label: 'Curious Beginner', description: "Learning the ropes, just getting started" },
];

const CONTENT_TYPES = [
  { value: 'MarketNews', label: 'Market News' },
  { value: 'Charts', label: 'Charts & Data' },
  { value: 'Social', label: 'Social Buzz' },
  { value: 'Fun', label: 'Fun & Memes' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Toggle helpers ──────────────────────────────────────────────────────────

  function toggleCoin(coin: string) {
    setSelectedCoins((prev) =>
      prev.includes(coin) ? prev.filter((c) => c !== coin) : [...prev, coin],
    );
  }

  function toggleContent(type: string) {
    setSelectedContent((prev) =>
      prev.includes(type) ? prev.filter((c) => c !== type) : [...prev, type],
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedCoins.length || !investorType || !selectedContent.length) {
      setError('Please answer all three questions before continuing.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onboardingApi.savePreferences({
        cryptoAssets: selectedCoins,
        investorType,
        contentTypes: selectedContent,
      });

      // Update the local auth state so ProtectedRoute doesn't redirect back here.
      if (user && token) {
        login(token, { ...user, preferencesSet: true });
      }

      navigate('/dashboard');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Answer 3 quick questions so we can personalise your dashboard.
        </p>
      </div>

      <div className="space-y-10">

        {/* Q1: Crypto assets */}
        <section>
          <p className="section-label mb-3">Q1 — Which crypto assets interest you?</p>
          <div className="flex flex-wrap gap-2">
            {CRYPTO_OPTIONS.map((coin) => (
              <button
                key={coin}
                onClick={() => toggleCoin(coin)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCoins.includes(coin)
                    ? 'border-brand bg-brand/20 text-brand-light'
                    : 'border-surface-border text-slate-400 hover:border-slate-400 hover:text-white'
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
        </section>

        {/* Q2: Investor type */}
        <section>
          <p className="section-label mb-3">Q2 — What kind of investor are you?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setInvestorType(type.value)}
                className={`card text-left transition-colors ${
                  investorType === type.value
                    ? 'border-brand bg-brand/10'
                    : 'hover:border-slate-400'
                }`}
              >
                <p className="font-semibold text-white">{type.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{type.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Q3: Content types */}
        <section>
          <p className="section-label mb-3">Q3 — What kind of content do you want to see?</p>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => toggleContent(type.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedContent.includes(type.value)
                    ? 'border-brand bg-brand/20 text-brand-light'
                    : 'border-surface-border text-slate-400 hover:border-slate-400 hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* Error */}
      {error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn-primary mt-8 w-full"
      >
        {isSubmitting ? 'Saving...' : 'Take me to my dashboard'}
      </button>
    </div>
  );
}
