// =============================================================================
// OFFLINE STORAGE SERVICE - IndexedDB-based for POS Transactions
// Handles offline data persistence and sync queue management
// =============================================================================

const DB_NAME = 'molabs_pos_db';
const DB_VERSION = 1;

// Store names
const STORES = {
  PENDING_SALES: 'pending_sales',
  PRODUCTS_CACHE: 'products_cache',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
} as const;

export interface PendingSale {
  id: string;
  created_at: string;
  items: any[];
  payment_method: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  coupon_code?: string;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  idempotency_key: string;
  synced: boolean;
  sync_attempts: number;
  last_sync_error?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'sale' | 'payment' | 'stock_update';
  data: any;
  created_at: string;
  attempts: number;
  last_attempt?: string;
  error?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<boolean> {
    if (this.isInitialized && this.db) return true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Pending sales store
        if (!db.objectStoreNames.contains(STORES.PENDING_SALES)) {
          const salesStore = db.createObjectStore(STORES.PENDING_SALES, { keyPath: 'id' });
          salesStore.createIndex('synced', 'synced', { unique: false });
          salesStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Products cache store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS_CACHE)) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS_CACHE, { keyPath: 'id' });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('barcode', 'barcode', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // =============================================================================
  // PENDING SALES OPERATIONS
  // =============================================================================

  async savePendingSale(sale: PendingSale): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PENDING_SALES, 'readwrite');
        const request = store.put(sale);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Failed to save pending sale:', request.error);
          resolve(false);
        };
      } catch (error) {
        console.error('Error saving pending sale:', error);
        resolve(false);
      }
    });
  }

  async getPendingSales(): Promise<PendingSale[]> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PENDING_SALES);
        const index = store.index('synced');
        const request = index.getAll(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          console.error('Failed to get pending sales:', request.error);
          resolve([]);
        };
      } catch (error) {
        console.error('Error getting pending sales:', error);
        resolve([]);
      }
    });
  }

  async markSaleSynced(id: string): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PENDING_SALES, 'readwrite');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const sale = getRequest.result;
            sale.synced = true;
            const putRequest = store.put(sale);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        getRequest.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error marking sale synced:', error);
        resolve(false);
      }
    });
  }

  async deletePendingSale(id: string): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PENDING_SALES, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error deleting pending sale:', error);
        resolve(false);
      }
    });
  }

  // =============================================================================
  // PRODUCTS CACHE OPERATIONS
  // =============================================================================

  async cacheProducts(products: any[]): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PRODUCTS_CACHE, 'readwrite');
        
        // Clear existing cache first
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
          let completed = 0;
          if (products.length === 0) {
            resolve(true);
            return;
          }
          
          products.forEach((product) => {
            const request = store.put(product);
            request.onsuccess = () => {
              completed++;
              if (completed === products.length) resolve(true);
            };
            request.onerror = () => {
              completed++;
              if (completed === products.length) resolve(true);
            };
          });
        };
        clearRequest.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error caching products:', error);
        resolve(false);
      }
    });
  }

  async getCachedProducts(): Promise<any[]> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PRODUCTS_CACHE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          console.error('Failed to get cached products:', request.error);
          resolve([]);
        };
      } catch (error) {
        console.error('Error getting cached products:', error);
        resolve([]);
      }
    });
  }

  async updateCachedProductStock(productId: string, newQuantity: number): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.PRODUCTS_CACHE, 'readwrite');
        const getRequest = store.get(productId);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const product = getRequest.result;
            product.stock_quantity = newQuantity;
            const putRequest = store.put(product);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        getRequest.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error updating cached product stock:', error);
        resolve(false);
      }
    });
  }

  // =============================================================================
  // SYNC QUEUE OPERATIONS
  // =============================================================================

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'attempts' | 'status'>): Promise<string> {
    await this.init();
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
      ...item,
    };

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
        const request = store.put(queueItem);
        request.onsuccess = () => resolve(queueItem.id);
        request.onerror = () => reject(new Error('Failed to add to sync queue'));
      } catch (error) {
        reject(error);
      }
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.SYNC_QUEUE);
        const index = store.index('status');
        const request = index.getAll(IDBKeyRange.only('pending'));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (error) {
        console.error('Error getting sync queue:', error);
        resolve([]);
      }
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const item = { ...getRequest.result, ...updates };
            const putRequest = store.put(item);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        getRequest.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error updating sync queue item:', error);
        resolve(false);
      }
    });
  }

  async removeSyncQueueItem(id: string): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        console.error('Error removing sync queue item:', error);
        resolve(false);
      }
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async getSetting<T>(key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.SETTINGS);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value ?? null);
        request.onerror = () => resolve(null);
      } catch (error) {
        resolve(null);
      }
    });
  }

  async setSetting<T>(key: string, value: T): Promise<boolean> {
    await this.init();
    return new Promise((resolve) => {
      try {
        const store = this.getStore(STORES.SETTINGS, 'readwrite');
        const request = store.put({ key, value });
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }

  async getPendingSalesCount(): Promise<number> {
    const sales = await this.getPendingSales();
    return sales.length;
  }

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const storeNames = Object.values(STORES);
    for (const storeName of storeNames) {
      try {
        const store = this.getStore(storeName, 'readwrite');
        await new Promise<void>((resolve) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        });
      } catch (error) {
        console.error(`Error clearing store ${storeName}:`, error);
      }
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();
