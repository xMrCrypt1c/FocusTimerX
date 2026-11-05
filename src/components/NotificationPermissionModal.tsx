import React from 'react';
import { Bell, Sparkles, X } from 'lucide-react';
import {
  dispatchSessionNotification,
  requestNotificationPermission,
} from '../lib/notifications';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  pendingNotification?: { title: string; body: string } | null;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  pendingNotification,
}) => {
  if (!isOpen) return null;

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      onPermissionGranted();
      if (pendingNotification) {
        dispatchSessionNotification(pendingNotification.title, pendingNotification.body);
      } else {
        dispatchSessionNotification(
          'Notifications Enabled!',
          'FocusTimerX will alert you whenever your focus or break timers finish.'
        );
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100"
        role="dialog"
        aria-modal="true"
        aria-label="Enable Timer Notifications"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-rose-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Session Complete</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-zinc-100 mt-2">
          Never miss a break or focus prompt
        </h3>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Allow notifications so FocusTimerX can alert you when your timer finishes, even if your phone screen is off or you're working in another tab or app.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleEnable}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
