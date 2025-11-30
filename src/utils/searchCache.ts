// Simple in-memory cache for search results
// In production, consider using IndexedDB or localStorage for persistence

interface CacheEntry {
  data: any[];
  timestamp: number;
}

class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any[] | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache size for debugging
  getSize(): number {
    return this.cache.size;
  }
}

export const searchCache = new SearchCache();

// Generate cache key from search term, type, and language
export const getCacheKey = (term: string, type: 'word' | 'kanji', language?: string): string => {
  const lang = language || 'japanese';
  return `${lang}:${type}:${term.toLowerCase().trim()}`;
};

