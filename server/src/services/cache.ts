import { prisma } from '../index';
import { Section } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Generic cache layer backed by the `cached_content` PostgreSQL table.
 *
 * Usage pattern:
 *   const data = await getCached(Section.prices, 'BTC,ETH');
 *   if (!data) {
 *     const fresh = await fetchFromApi();
 *     await setCached(Section.prices, 'BTC,ETH', fresh, ttlSeconds);
 *   }
 */

/** Returns the cached payload if it exists and hasn't expired, otherwise null. */
export async function getCached<T>(section: Section, cacheKey: string): Promise<T | null> {
  try {
    const entry = await prisma.cachedContent.findUnique({
      where: { section_cacheKey: { section, cacheKey } },
    });

    if (!entry) return null;

    // Treat expired entries as cache misses.
    if (entry.expiresAt < new Date()) {
      logger.debug('Cache expired', { section, cacheKey });
      return null;
    }

    logger.debug('Cache hit', { section, cacheKey });
    return entry.payload as T;
  } catch (err) {
    // A cache failure should never break the app — log and continue.
    logger.warn('Cache read error', { section, cacheKey, error: (err as Error).message });
    return null;
  }
}

/** Upserts a cache entry with the given TTL (in seconds). */
export async function setCached<T>(
  section: Section,
  cacheKey: string,
  payload: T,
  ttlSeconds: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  try {
    await prisma.cachedContent.upsert({
      where: { section_cacheKey: { section, cacheKey } },
      create: { section, cacheKey, payload: payload as object, expiresAt },
      update: { payload: payload as object, expiresAt },
    });

    logger.debug('Cache set', { section, cacheKey, expiresAt });
  } catch (err) {
    logger.warn('Cache write error', { section, cacheKey, error: (err as Error).message });
  }
}

/** Removes a specific cache entry (used to force a refresh). */
export async function invalidateCache(section: Section, cacheKey: string): Promise<void> {
  await prisma.cachedContent.deleteMany({ where: { section, cacheKey } });
  logger.debug('Cache invalidated', { section, cacheKey });
}
