// =============================================================================
// NETWORK STATUS BAR - Visual indicator for online/offline status
// =============================================================================

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusBarProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  onSync: () => void;
}

export function NetworkStatusBar({
  isOnline,
  isSyncing,
  pendingCount,
  onSync,
}: NetworkStatusBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
        isOnline
          ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300'
          : 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      
      <span className="font-medium">
        {isOnline ? 'Online' : 'Offline Mode'}
      </span>

      {pendingCount > 0 && (
        <>
          <Badge
            variant="secondary"
            className={cn(
              'ml-1',
              isOnline
                ? 'bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100'
                : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
            )}
          >
            {pendingCount} pending
          </Badge>

          {isOnline && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 ml-1"
              onClick={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </>
      )}

      {!isOnline && (
        <div className="flex items-center gap-1 ml-2">
          <CloudOff className="h-3 w-3" />
          <span className="text-xs">Sales saved locally</span>
        </div>
      )}
    </div>
  );
}
