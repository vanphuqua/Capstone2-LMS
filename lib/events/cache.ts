/**
 * Cache Utility
 *
 * In-memory cache with TTL for frequently accessed data.
 * Reduces database load for common queries (course data, user data, etc.)
 *
 * For production with multiple instances, replace with Redis.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    hits: number;
  }
  
  class MemoryCache {
    private store: Map<string, CacheEntry<any>> = new Map();
    private maxSize: number;
    private cleanupInterval: NodeJS.Timeout;
  
    constructor(maxSize = 10_000) {
      this.maxSize = maxSize;
  
      // Clean up expired entries every 2 minutes
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 120_000);
    }
  
    /**
     * Get a cached value
     */
    get<T>(key: string): T | null {
      const entry = this.store.get(key);
      if (!entry) return null;
  
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }
  
      entry.hits++;
      return entry.data as T;
    }
  
    /**
     * Set a cached value with TTL in milliseconds
     */
    set<T>(key: string, data: T, ttlMs: number): void {
      // Evict if at capacity (LRU-style: remove least-hit entries)
      if (this.store.size >= this.maxSize) {
        this.evict();
      }
  
      this.store.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
        hits: 0,
      });
    }
  
    /**
     * Delete a specific key
     */
    delete(key: string): boolean {
      return this.store.delete(key);
    }
  
    /**
     * Delete all keys matching a pattern
     */
    deletePattern(pattern: string): number {
      let count = 0;
      for (const key of this.store.keys()) {
        if (key.includes(pattern)) {
          this.store.delete(key);
          count++;
        }
      }
      return count;
    }