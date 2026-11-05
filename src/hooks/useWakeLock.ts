import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestLock = async () => {
      if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
        return;
      }
      try {
        if (!wakeLockRef.current) {
          const lock = await navigator.wakeLock.request('screen');
          if (isMounted) {
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          } else {
            lock.release().catch(() => {});
          }
        }
      } catch (err) {
        // WakeLock can fail if battery saver is on or user denied
        console.debug('WakeLock request ignored:', err);
      }
    };

    const releaseLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore
        }
        wakeLockRef.current = null;
      }
    };

    if (enabled) {
      requestLock();
    } else {
      releaseLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [enabled]);
}
