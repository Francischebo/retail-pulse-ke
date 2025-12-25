// =============================================================================
// OFFLINE SYNC HOOK - Manages synchronization of offline transactions
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineStorage, PendingSale, SyncQueueItem } from '@/lib/offline/storage';
import { createSaleAtomic, processPayment } from '@/lib/pos/payment-service';
import { PaymentMethod } from '@/lib/pos/types';

const MAX_SYNC_RETRIES = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export function useOfflineSync() {
  const { toast } = useToast();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncError: null,
  });
  const isSyncingRef = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await offlineStorage.getPendingSalesCount();
    setSyncStatus((prev) => ({ ...prev, pendingCount: count }));
  }, []);

  // Sync a single sale
  const syncSale = useCallback(async (sale: PendingSale): Promise<boolean> => {
    try {
      // Create sale in database
      const saleResult = await createSaleAtomic({
        items: sale.items,
        paymentMethod: sale.payment_method as PaymentMethod,
        customerId: sale.customer_id,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        couponCode: sale.coupon_code,
        discount: sale.discount,
        idempotencyKey: sale.idempotency_key,
      });

      if (!saleResult.success) {
        throw new Error(saleResult.error || 'Failed to create sale');
      }

      // Process payment
      const paymentResult = await processPayment({
        saleId: saleResult.sale_id!,
        paymentMethod: sale.payment_method as PaymentMethod,
        amount: sale.total,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to process payment');
      }

      // Mark as synced
      await offlineStorage.markSaleSynced(sale.id);
      
      // Clean up after successful sync
      await offlineStorage.deletePendingSale(sale.id);

      return true;
    } catch (error: any) {
      console.error('Failed to sync sale:', error);
      
      // Update sale with error
      const updatedSale: PendingSale = {
        ...sale,
        sync_attempts: sale.sync_attempts + 1,
        last_sync_error: error.message,
      };
      await offlineStorage.savePendingSale(updatedSale);

      return false;
    }
  }, []);

  // Sync all pending sales
  const syncPendingSales = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) return;

    isSyncingRef.current = true;
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const pendingSales = await offlineStorage.getPendingSales();
      
      if (pendingSales.length === 0) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: new Date(),
        }));
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const sale of pendingSales) {
        // Skip if too many retries
        if (sale.sync_attempts >= MAX_SYNC_RETRIES) {
          failCount++;
          continue;
        }

        const success = await syncSale(sale);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        // Small delay between syncs to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await updatePendingCount();

      if (successCount > 0) {
        toast({
          title: 'Sales Synced',
          description: `${successCount} offline sale(s) synced successfully`,
        });
      }

      if (failCount > 0) {
        setSyncStatus((prev) => ({
          ...prev,
          syncError: `${failCount} sale(s) failed to sync`,
        }));
      }

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
      }));
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, syncSale, updatePendingCount, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      // Delay sync to ensure stable connection
      const timeoutId = setTimeout(() => {
        syncPendingSales();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, wasOffline, syncPendingSales]);

  // Initial load
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot sync while offline',
        variant: 'destructive',
      });
      return;
    }
    await syncPendingSales();
  }, [isOnline, syncPendingSales, toast]);

  return {
    ...syncStatus,
    isOnline,
    triggerSync,
    updatePendingCount,
  };
}
