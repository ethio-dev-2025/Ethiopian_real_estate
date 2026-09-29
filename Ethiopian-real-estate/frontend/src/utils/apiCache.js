// src/utils/apiCache.js
class APICache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60000; // 60 seconds default cache time
  }

  // Generate cache key from URL and options
  getCacheKey(url, options = {}) {
    const key = `${url}-${JSON.stringify(options)}`;
    return key;
  }

  // Get cached data
  get(url, options = {}) {
    const key = this.getCacheKey(url, options);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.defaultTTL) {
      console.log(`✅ Cache HIT for: ${url}`);
      return cached.data;
    }
    
    if (cached) {
      console.log(`⏰ Cache EXPIRED for: ${url}`);
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set cache data
  set(url, data, options = {}) {
    const key = this.getCacheKey(url, options);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: this.defaultTTL
    });
    console.log(`💾 Cache SET for: ${url}`);
  }

  // Clear specific cache
  clear(url, options = {}) {
    const key = this.getCacheKey(url, options);
    this.cache.delete(key);
    console.log(`🗑️ Cache CLEARED for: ${url}`);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
    console.log(`🗑️ All cache CLEARED`);
  }

  // Clear cache by pattern
  clearPattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Cleared ${count} cache entries matching: ${pattern}`);
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiCache = new APICache();

// Wrapper fetch function with caching
export const cachedFetch = async (url, options = {}, cacheTime = 60000) => {
  // Don't cache POST, PUT, DELETE requests
  if (options.method && options.method !== 'GET') {
    return fetch(url, options);
  }

  // Check cache first
  const cachedData = apiCache.get(url, options);
  if (cachedData) {
    return cachedData;
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Cache the response
  apiCache.set(url, data, options);
  
  return data;
};

// Function to invalidate cache after mutations
export const invalidateCache = (pattern) => {
  if (pattern) {
    apiCache.clearPattern(pattern);
  } else {
    apiCache.clearAll();
  }
};