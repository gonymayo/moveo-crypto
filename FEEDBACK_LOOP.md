# Bonus: ML Feedback Loop Design

## How Feedback is Stored

Every time a user clicks thumbs-up or thumbs-down on a dashboard section, the app
records a row in the `votes` table:

```
votes (id, user_id, section, content_id, vote, created_at)
```

Combined with the `user_preferences` table, each vote is effectively a labeled
training sample:

```
(investor_type, preferred_coins, content_types[], section, content_id) → label ∈ {+1, -1}
```

This means from day one the app is silently collecting a relevance dataset —
no extra infrastructure required.

---

## How the Data Would Be Used for Model Improvement

### Step 1 — Nightly Export

A scheduled job (e.g. pg_dump or a SQL query) exports all votes joined with
user preferences into a JSONL file:

```jsonl
{"investor_type":"HODLer","coins":["BTC","ETH"],"section":"ai_insight","content_id":"2024-07-10","vote":1}
{"investor_type":"DayTrader","coins":["SOL"],"section":"news","content_id":"article_abc","vote":-1}
```

### Step 2 — Feature Engineering

Each sample is encoded as a feature vector:
- Categorical: `investor_type`, `section` → one-hot or embedding
- Multi-hot: `preferred_coins`, `content_types`
- Content features: article keywords, coin tickers mentioned, sentiment score

### Step 3 — Model Training Options

**Option A — Content Ranker (short-term)**
Train a lightweight binary classifier (e.g. logistic regression or XGBoost) that
predicts thumbs-up probability. Use it to re-rank which articles or AI snippets
to show first.

**Option B — Prompt Optimization (medium-term)**
Use vote signals as a reward to fine-tune the OpenRouter prompt template via
RLHF-style feedback: prompts that generated upvoted insights are reinforced;
those that generated downvotes are penalized.

**Option C — Collaborative Filtering (long-term)**
Once enough users have voted, build a user-item matrix and use matrix
factorization (ALS, SVD) to recommend content that similar users liked —
even for sections the current user hasn't explicitly rated.

### Step 4 — A/B Testing Before Rollout

Split users into control (old ranker) and treatment (new model) cohorts.
Compare thumbs-up rate over 7 days. Promote the model only if uplift is
statistically significant.

---

## Key Insight

The schema is already future-proof. By storing `section + content_id + user_id + vote`
today, we accumulate a labeled relevance dataset that supports supervised ranking,
collaborative filtering, and prompt optimization — with **no schema changes required**
when the time comes to build the ML pipeline.
