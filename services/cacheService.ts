/**
 * Cache Service
 * 
 * Provides API response caching using IndexedDB for better performance
 * and reduced API quota usage. Caches board members, ICP profiles, persona
 * breakdowns, and competitor analysis.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  boardMembers: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  icpProfile: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  personaBreakdowns: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  competitorAnalysis: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  report: { ttl: 30 * 24 * 60 * 60 * 1000 }, // 30 days
};

let db: IDBDatabase | null = null;
const DB_NAME = 'tzm_cab_cache';
const DB_VERSION = 1;
const STORE_NAME = 'api_cache';

/**
 * Initialize IndexedDB database
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
};

/**
 * Generate cache key from input parameters
 */
export const generateCacheKey = (
  type: string,
  ...params: (string | undefined | null)[]
): string => {
  const normalizedParams = params
    .map(p => (p || '').toString().toLowerCase().trim())
    .filter(p => p.length > 0)
    .join('|');
  
  return `${type}:${normalizedParams}`;
};

/**
 * Get cached data
 */
export const getCached = async <T>(
  cacheKey: string,
  type: string = 'default'
): Promise<T | null> => {
  try {
    const database = await initDB();
    const config = CACHE_CONFIGS[type] || { ttl: 24 * 60 * 60 * 1000 };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Delete expired entry
          const deleteTransaction = database.transaction([STORE_NAME], 'readwrite');
          deleteTransaction.objectStore(STORE_NAME).delete(cacheKey);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => {
        console.warn('Cache read error:', request.error);
        resolve(null); // Fail gracefully
      };
    });
  } catch (error) {
    console.warn('Cache initialization error:', error);
    return null; // Fail gracefully - don't break the app
  }
};

/**
 * Set cached data
 */
export const setCached = async <T>(
  cacheKey: string,
  data: T,
  type: string = 'default'
): Promise<void> => {
  try {
    const database = await initDB();
    const config = CACHE_CONFIGS[type] || { ttl: 24 * 60 * 60 * 1000 };

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key: cacheKey, ...entry });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn('Cache write error:', request.error);
        resolve(); // Fail gracefully - don't break the app
      };
    });
  } catch (error) {
    console.warn('Cache write initialization error:', error);
    // Fail gracefully - don't break the app
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpired = async (): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.warn('Cache cleanup error:', request.error);
        resolve(); // Fail gracefully
      };
    });
  } catch (error) {
    console.warn('Cache cleanup initialization error:', error);
  }
};

/**
 * Clear all cache entries
 */
export const clearAll = async (): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn('Cache clear error:', request.error);
        resolve(); // Fail gracefully
      };
    });
  } catch (error) {
    console.warn('Cache clear initialization error:', error);
  }
};

/**
 * Clear cache entries by type prefix
 */
export const clearByType = async (type: string): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.key.toString().startsWith(`${type}:`)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.warn('Cache clear by type error:', request.error);
        resolve(); // Fail gracefully
      };
    });
  } catch (error) {
    console.warn('Cache clear by type initialization error:', error);
  }
};

// Clean up expired entries on load (non-blocking)
if (typeof window !== 'undefined') {
  clearExpired().catch(() => {
    // Silently fail - cleanup is not critical
  });
}

