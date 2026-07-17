// src/services/cacheService.ts

export interface CacheEntry {
  query: string;
  response: string;
  timestamp: number;
  userId: string | null; // null for guest
}

const CACHE_KEY = 'ai-lowcode-cache';
const MAX_CACHE_SIZE = 100; // 最多缓存100条
const CACHE_EXPIRE_DAYS = 7; // 缓存7天过期

// 获取当前用户ID
function getCurrentUserId(): string | null {
  const authData = localStorage.getItem('ai-lowcode-auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.state?.user?.id || null;
  } catch {
    return null;
  }
}

// 获取所有缓存
function getCache(): CacheEntry[] {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 保存缓存
function saveCache(cache: CacheEntry[]): void {
  // 清理过期缓存
  const now = Date.now();
  const expireTime = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  cache = cache.filter(entry => now - entry.timestamp < expireTime);

  // 限制缓存大小，保留最新的
  if (cache.length > MAX_CACHE_SIZE) {
    cache = cache.slice(-MAX_CACHE_SIZE);
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// 计算字符串相似度 (Jaccard 相似度)
function calculateSimilarity(str1: string, str2: string): number {
  // 标准化字符串：转小写、去除标点、分词
  const normalize = (s: string) => {
    return s.toLowerCase()
      .replace(/[^一-龥a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  };

  const words1 = new Set(normalize(str1));
  const words2 = new Set(normalize(str2));

  if (words1.size === 0 || words2.size === 0) return 0;

  // 计算交集
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// 查找相似问题的缓存
export function findSimilarCache(query: string, threshold = 0.7): CacheEntry | null {
  const cache = getCache();
  const userId = getCurrentUserId();

  // 只查找当前用户的缓存
  const userCache = cache.filter(entry => entry.userId === userId);

  let bestMatch: CacheEntry | null = null;
  let bestScore = 0;

  for (const entry of userCache) {
    const score = calculateSimilarity(query, entry.query);
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch;
}

// 添加缓存
export function addCache(query: string, response: string): void {
  const cache = getCache();
  const userId = getCurrentUserId();

  // 检查是否已存在相同问题
  const existingIndex = cache.findIndex(
    entry => entry.query === query && entry.userId === userId
  );

  const newEntry: CacheEntry = {
    query,
    response,
    timestamp: Date.now(),
    userId,
  };

  if (existingIndex >= 0) {
    // 更新现有缓存
    cache[existingIndex] = newEntry;
  } else {
    // 添加新缓存
    cache.push(newEntry);
  }

  saveCache(cache);
}

// 清除缓存
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// 获取缓存统计
export function getCacheStats(): { total: number; userCache: number } {
  const cache = getCache();
  const userId = getCurrentUserId();
  const userCache = cache.filter(entry => entry.userId === userId);

  return {
    total: cache.length,
    userCache: userCache.length,
  };
}
