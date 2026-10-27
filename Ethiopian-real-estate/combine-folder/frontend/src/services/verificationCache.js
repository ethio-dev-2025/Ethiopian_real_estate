// frontend/src/services/verificationCache.js

class VerificationCache {
  constructor() {
    this.cache = {
      pending: { data: null, timestamp: null },
      approved: { data: null, timestamp: null },
      rejected: { data: null, timestamp: null },
      all: { data: null, timestamp: null }
    };
    this.CACHE_DURATION = 60000; // 60 seconds cache
  }

  get(key) {
    const cached = this.cache[key];
    if (cached && cached.data && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (age < this.CACHE_DURATION) {
        console.log(`📦 Cache hit for ${key} (${Math.round(age/1000)}s old)`);
        return cached.data;
      }
    }
    console.log(`🔄 Cache miss for ${key}`);
    return null;
  }

  set(key, data) {
    this.cache[key] = {
      data: data,
      timestamp: Date.now()
    };
    console.log(`💾 Cached ${key} with ${data.length} items`);
  }

  clear(key) {
    if (key) {
      this.cache[key] = { data: null, timestamp: null };
      console.log(`🗑️ Cleared cache for ${key}`);
    } else {
      Object.keys(this.cache).forEach(k => {
        this.cache[k] = { data: null, timestamp: null };
      });
      console.log(`🗑️ Cleared all cache`);
    }
  }
}

export const verificationCache = new VerificationCache();