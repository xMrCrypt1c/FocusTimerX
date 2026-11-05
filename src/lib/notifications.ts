/**
 * Device and Browser Notification Manager for FocusTimerX
 * Supports ServiceWorker notifications for mobile Android PWA and standard desktop notifications.
 */

export interface NotificationPayload {
  title: string;
  body: string;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function triggerDeviceVibration(pattern: number[] = [200, 100, 200]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported hardware
    }
  }
}

export async function dispatchSessionNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  triggerDeviceVibration([250, 120, 250]);

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'focustimerx-timer-complete',
    renotify: true,
    silent: false,
    data: {
      url: '/',
    },
  } as unknown as NotificationOptions;

  // Try Service Worker registration first (standard for Android PWA background notifications)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) {
      console.debug('ServiceWorker showNotification skipped, falling back:', e);
    }
  }

  // Standard window Notification fallback
  try {
    const notif = new Notification(title, options);
    // Auto close after 10s
    setTimeout(() => {
      try {
        notif.close();
      } catch {}
    }, 10000);
  } catch (err) {
    console.warn('Window Notification creation error:', err);
  }
}
