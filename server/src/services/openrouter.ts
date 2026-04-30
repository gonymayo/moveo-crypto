import { Section } from '@prisma/client';
import { getCached, setCached } from './cache';
import logger from '../utils/logger';

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL ?? 'mistralai/mistral-7b-instruct:free';

// Cache the AI insight for a full day — one insight per user per day is the goal.
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface AiInsight {
  text: string;
  model: string;
  generatedAt: string;
}

/**
 * Generates a personalised daily crypto insight via OpenRouter.
 * The insight is cached for 24 hours keyed by (userId, today's date) so the
 * LLM is called at most once per user per day.
 */
export async function getAiInsight(
  tickers: string[],
  investorType: string,
  userId?: string,
): Promise<AiInsight> {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const cacheKey = `ai:${userId ?? 'shared'}:${today}`;

  const cached = await getCached<AiInsight>(Section.ai_insight, cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
    logger.warn('OPENROUTER_API_KEY not set — returning static fallback insight');
    return {
      text: `As a ${investorType}, keep an eye on ${tickers.join(', ')} today. Market conditions suggest caution — always do your own research before making any investment decisions.`,
      model: 'static-fallback',
      generatedAt: new Date().toISOString(),
    };
  }

  const prompt = buildPrompt(tickers, investorType);

  logger.debug('Requesting AI insight from OpenRouter', { model: MODEL, userId });

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      // OpenRouter recommends including these headers for tracking.
      'HTTP-Referer': 'https://moveo-crypto.vercel.app',
      'X-Title': 'Moveo Crypto Advisor',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${body}`);
  }

  const json = (await response.json()) as {
    choices: { message: { content: string } }[];
    model: string;
  };

  const insight: AiInsight = {
    text: json.choices[0].message.content.trim(),
    model: json.model,
    generatedAt: new Date().toISOString(),
  };

  await setCached(Section.ai_insight, cacheKey, insight, CACHE_TTL_SECONDS);

  return insight;
}

/**
 * Builds the LLM prompt based on the user's profile.
 * Keep it concise — free models have limited context and we want a focused response.
 */
function buildPrompt(tickers: string[], investorType: string): string {
  return [
    `You are a concise crypto market analyst. Provide a single, actionable daily insight.`,
    `Investor profile: ${investorType}.`,
    `Assets of interest: ${tickers.join(', ')}.`,
    `Write 2-3 sentences max. Focus on one clear observation or tip.`,
    `Do NOT include dates, headers, markdown formatting, or disclaimers. Plain text only.`,
  ].join(' ');
}
