/**
 * API Throttling System
 * 
 * This module provides utilities to prevent excessive API calls
 * by implementing request throttling, caching, and deduplication.
 */

// Track the last time each endpoint was called
const lastApiCallTime: Record<string, number> = {};

// Track in-progress API calls
const inProgressCalls: Record<string, boolean> = {};

// Minimum time between API calls (in milliseconds)
const MIN_TIME_BETWEEN_CALLS = 2000; // 2 seconds

// Cache for API responses
const apiResponseCache: Record<string, {
  data: any;
  timestamp: number;
  expiresAt: number;
}> = {};

/**
 * Checks if an API call should be allowed based on throttling rules
 * @param endpoint The API endpoint
 * @returns Whether the call should be allowed
 */
export function shouldAllowApiCall(endpoint: string): boolean {
  const now = Date.now();
  
  // If this endpoint is already being called, don't allow another call
  if (inProgressCalls[endpoint]) {
    console.log(`[THROTTLE] API call to ${endpoint} already in progress, skipping`);
    return false;
  }
  
  // If this endpoint was called recently, don't allow another call
  if (lastApiCallTime[endpoint] && now - lastApiCallTime[endpoint] < MIN_TIME_BETWEEN_CALLS) {
    console.log(`[THROTTLE] API call to ${endpoint} throttled (called ${now - lastApiCallTime[endpoint]}ms ago)`);
    return false;
  }
  
  return true;
}

/**
 * Marks an API call as started
 * @param endpoint The API endpoint
 */
export function markApiCallStarted(endpoint: string): void {
  inProgressCalls[endpoint] = true;
  lastApiCallTime[endpoint] = Date.now();
}

/**
 * Marks an API call as completed
 * @param endpoint The API endpoint
 */
export function markApiCallCompleted(endpoint: string): void {
  inProgressCalls[endpoint] = false;
}

/**
 * Caches an API response
 * @param cacheKey The cache key
 * @param data The data to cache
 * @param ttlSeconds Time to live in seconds
 */
export function cacheApiResponse(cacheKey: string, data: any, ttlSeconds: number = 60): void {
  const now = Date.now();
  apiResponseCache[cacheKey] = {
    data,
    timestamp: now,
    expiresAt: now + (ttlSeconds * 1000)
  };
}

/**
 * Gets a cached API response
 * @param cacheKey The cache key
 * @returns The cached data or null if not found or expired
 */
export function getCachedApiResponse(cacheKey: string): any {
  const cached = apiResponseCache[cacheKey];
  if (!cached) return null;
  
  const now = Date.now();
  if (now > cached.expiresAt) {
    // Cache expired
    delete apiResponseCache[cacheKey];
    return null;
  }
  
  return cached.data;
}

/**
 * Clears the cache for a specific key
 * @param cacheKey The cache key to clear
 */
export function clearCacheForKey(cacheKey: string): void {
  delete apiResponseCache[cacheKey];
}

/**
 * Throttled fetch function that implements caching and throttling
 * @param url The URL to fetch
 * @param options Fetch options
 * @param cacheKey Optional cache key
 * @param cacheTtl Cache TTL in seconds
 * @returns The fetch response
 */
export async function throttledFetch(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTtl: number = 60
): Promise<Response> {
  // If a cache key is provided, check the cache first
  if (cacheKey) {
    const cached = getCachedApiResponse(cacheKey);
    if (cached) {
      console.log(`[THROTTLE] Using cached response for ${url} (cache key: ${cacheKey})`);
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Check if this call should be allowed
  if (!shouldAllowApiCall(url)) {
    throw new Error(`API call to ${url} throttled`);
  }
  
  // Mark the call as started
  markApiCallStarted(url);
  
  try {
    // Make the actual fetch call
    const response = await fetch(url, options);
    
    // If successful and a cache key is provided, cache the response
    if (response.ok && cacheKey) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      cacheApiResponse(cacheKey, data, cacheTtl);
    }
    
    return response;
  } finally {
    // Mark the call as completed
    markApiCallCompleted(url);
  }
}
