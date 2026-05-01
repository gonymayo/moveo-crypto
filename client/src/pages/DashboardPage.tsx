import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi } from '@/api/dashboard';
import { votesApi, type Section, type VoteValue } from '@/api/votes';

// ── Sub-components ────────────────────────────────────────────────────────────

function VoteButtons({
  section,
  contentId,
  currentVote,
  onVote,
}: {
  section: Section;
  contentId: string;
  currentVote?: 'up' | 'down';
  onVote: (section: Section, contentId: string, vote: VoteValue) => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
      <span className="text-xs text-slate-500">Helpful?</span>
      <button
        onClick={() => onVote(section, contentId, 'up')}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
          currentVote === 'up'
            ? 'bg-green-500/20 ring-1 ring-green-500 text-green-400'
            : 'text-slate-400 hover:bg-green-500/10 hover:text-green-400'
        }`}
        title="Thumbs up"
      >
        👍
      </button>
      <button
        onClick={() => onVote(section, contentId, 'down')}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
          currentVote === 'down'
            ? 'bg-red-500/20 ring-1 ring-red-500 text-red-400'
            : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'
        }`}
        title="Thumbs down"
      >
        👎
      </button>
    </div>
  );
}

function SectionShell({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col">
      <p className="section-label mb-1">{label}</p>
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-surface-border" />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    // Refetch every 5 minutes automatically.
    refetchInterval: 5 * 60 * 1000,
  });

  // Local optimistic vote state so buttons respond instantly on click.
  const [localVotes, setLocalVotes] = useState<Map<string, 'up' | 'down'>>(new Map());

  // Only use local (in-session) votes — buttons always start unselected after a refresh.
  const voteMap = new Map<string, 'up' | 'down'>(localVotes);

  const voteMutation = useMutation({
    mutationFn: votesApi.submit,
    onSuccess: (_, variables) => {
      // Update only the votes slice in the cache — do NOT refetch the full
      // dashboard, as that would load a new random meme and reset the page.
      queryClient.setQueryData(['dashboard'], (old: typeof data) => {
        if (!old) return old;
        const filtered = old.votes.filter(
          (v) => !(v.section === variables.section && v.contentId === variables.contentId),
        );
        return {
          ...old,
          votes: [...filtered, { section: variables.section, contentId: variables.contentId, vote: variables.vote }],
        };
      });
    },
  });

  function handleVote(section: Section, contentId: string, vote: VoteValue) {
    // Update UI immediately (optimistic), then sync with server.
    setLocalVotes((prev) => new Map(prev).set(`${section}:${contentId}`, vote));
    voteMutation.mutate({ section, contentId, vote });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">

      {/* Top bar */}
      <header className="border-b border-surface-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Crypto Advisor</h1>
            <p className="text-xs text-slate-400">
              Good {getTimeOfDay()}, {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLocalVotes(new Map()); refetch(); }}
              disabled={isFetching}
              className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={logout} className="btn-ghost text-xs">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard grid */}
      <main className="mx-auto max-w-6xl px-6 py-8">

        {isError && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Failed to load dashboard data. Check your connection and try refreshing.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">

          {/* ── Coin Prices ───────────────────────────────────────────────── */}
          <SectionShell title="Coin Prices" label="Live Market">
            {isLoading ? (
              <Skeleton />
            ) : data?.prices ? (
              <div className="space-y-3">
                {data.prices.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-white">{coin.name}</p>
                        <p className="text-xs uppercase text-slate-500">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        ${coin.current_price.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          coin.price_change_percentage_24h >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                        {coin.price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
                <VoteButtons
                  section="prices"
                  contentId="prices-today"
                  currentVote={voteMap.get('prices:prices-today')}
                  onVote={handleVote}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Price data unavailable.</p>
            )}
          </SectionShell>

          {/* ── Market News ───────────────────────────────────────────────── */}
          <SectionShell title="Market News" label="Latest Headlines">
            {isLoading ? (
              <Skeleton />
            ) : data?.news ? (
              <div className="space-y-3">
                {data.news.map((article) => (
                  <div key={article.id}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-brand-light transition-colors"
                    >
                      {article.title}
                    </a>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {article.source.title} &middot;{' '}
                      {new Date(article.published_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <VoteButtons
                  section="news"
                  contentId="news-today"
                  currentVote={voteMap.get('news:news-today')}
                  onVote={handleVote}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">News unavailable.</p>
            )}
          </SectionShell>

          {/* ── AI Insight ────────────────────────────────────────────────── */}
          <SectionShell title="AI Insight of the Day" label="Personalised Analysis">
            {isLoading ? (
              <Skeleton />
            ) : data?.insight ? (
              <div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {data.insight.text.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim()}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Generated by {data.insight.model} &middot;{' '}
                  {new Date(data.insight.generatedAt).toLocaleDateString()}
                </p>
                <VoteButtons
                  section="ai_insight"
                  contentId={`ai-${new Date().toISOString().split('T')[0]}`}
                  currentVote={voteMap.get(
                    `ai_insight:ai-${new Date().toISOString().split('T')[0]}`,
                  )}
                  onVote={handleVote}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">AI insight unavailable.</p>
            )}
          </SectionShell>

          {/* ── Fun Meme ──────────────────────────────────────────────────── */}
          <SectionShell title="Crypto Meme of the Day" label="For the Culture">
            {isLoading ? (
              <Skeleton />
            ) : data?.meme ? (
              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">{data.meme.title}</p>
                <img
                  src={data.meme.imageUrl}
                  alt={data.meme.title}
                  className="w-full rounded-lg object-contain"
                  style={{ maxHeight: 280 }}
                  onError={(e) => {
                    // If the image fails to load, hide it gracefully.
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <a
                  href={data.meme.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-slate-500 hover:text-slate-300"
                >
                  r/{data.meme.subreddit} &middot; {data.meme.score.toLocaleString()} upvotes
                </a>
                <VoteButtons
                  section="meme"
                  contentId={data.meme.id}
                  currentVote={voteMap.get(`meme:${data.meme.id}`)}
                  onVote={handleVote}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Meme unavailable.</p>
            )}
          </SectionShell>

        </div>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
