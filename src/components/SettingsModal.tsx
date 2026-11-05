import React, { useState } from 'react';
import { Bell, BellOff, Download, ExternalLink, Volume2, VolumeX, X } from 'lucide-react';
import {
  dispatchSessionNotification,
  requestNotificationPermission,
} from '../lib/notifications';
import { AppTheme, UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onPlayTestSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPlayTestSound,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    const permission = await requestNotificationPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      onUpdateSettings({ notificationEnabled: true });
      dispatchSessionNotification('Notifications Active', 'FocusTimerX alerts are ready to go!');
    } else {
      onUpdateSettings({ notificationEnabled: false });
    }
  };

  const handleTestNotification = () => {
    dispatchSessionNotification(
      'FocusTimerX Test Alert',
      'This is how you will be notified when your focus or break timers finish!'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 max-h-[88vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Timer Settings</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Preferences sync automatically to all devices</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 my-5">
          {/* Section: Durations */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Durations (minutes)
            </h3>
            <div className="space-y-3">
              {/* Focus duration */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-sm font-medium text-zinc-200">Focus Duration</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="90"
                    step="1"
                    value={settings.focusDurationMinutes}
                    onChange={(e) =>
                      onUpdateSettings({ focusDurationMinutes: Number(e.target.value) })
                    }
                    className="w-24 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono w-10 text-right text-rose-400">
                    {settings.focusDurationMinutes}m
                  </span>
                </div>
              </div>

              {/* Short break duration */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-sm font-medium text-zinc-200">Short Break</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={settings.shortBreakDurationMinutes}
                    onChange={(e) =>
                      onUpdateSettings({ shortBreakDurationMinutes: Number(e.target.value) })
                    }
                    className="w-24 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono w-10 text-right text-emerald-400">
                    {settings.shortBreakDurationMinutes}m
                  </span>
                </div>
              </div>

              {/* Long break duration */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-sm font-medium text-zinc-200">Long Break</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={settings.longBreakDurationMinutes}
                    onChange={(e) =>
                      onUpdateSettings({ longBreakDurationMinutes: Number(e.target.value) })
                    }
                    className="w-24 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono w-10 text-right text-cyan-400">
                    {settings.longBreakDurationMinutes}m
                  </span>
                </div>
              </div>

              {/* Long break interval */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-sm font-medium text-zinc-200">Long Break Interval</span>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSettings({ longBreakInterval: val })}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                        settings.longBreakInterval === val
                          ? 'bg-rose-500 text-white font-semibold'
                          : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Daily Goals */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Daily Focus Goals
            </h3>
            <div className="space-y-3">
              {/* Daily Focus Minutes Goal */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <div>
                  <span className="text-sm font-medium text-zinc-200 block">Daily Target Time</span>
                  <span className="text-[11px] text-zinc-500">Minutes focused per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="360"
                    step="15"
                    value={settings.dailyGoalMinutes || 100}
                    onChange={(e) =>
                      onUpdateSettings({ dailyGoalMinutes: Number(e.target.value) })
                    }
                    className="w-24 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono w-12 text-right text-rose-400">
                    {settings.dailyGoalMinutes || 100}m
                  </span>
                </div>
              </div>

              {/* Daily Target Sessions */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <span className="text-sm font-medium text-zinc-200">Daily Target Sessions</span>
                <div className="flex items-center gap-2">
                  {[2, 4, 6, 8].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSettings({ dailyGoalSessions: val })}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                        (settings.dailyGoalSessions || 4) === val
                          ? 'bg-rose-500 text-white font-semibold'
                          : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Automation */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Automation
            </h3>
            <div className="space-y-2 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm font-medium text-zinc-200">Auto-start Breaks</span>
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
                  className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                />
              </label>
              <div className="border-t border-zinc-800/50 my-1" />
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm font-medium text-zinc-200">Auto-start Focus</span>
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  onChange={(e) => onUpdateSettings({ autoStartFocus: e.target.checked })}
                  className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: Audio & Notifications */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Sound & Alerts
            </h3>
            <div className="space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-rose-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                  )}
                  <span className="text-sm font-medium text-zinc-200">Completion Chime</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPlayTestSound}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-700/60 hover:bg-zinc-700 text-zinc-300 transition"
                  >
                    Test
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-rose-500 cursor-pointer ml-1"
                  />
                </div>
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  {settings.notificationEnabled ? (
                    <Bell className="w-4 h-4 text-rose-400" />
                  ) : (
                    <BellOff className="w-4 h-4 text-zinc-500" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-zinc-200 block">Notifications</span>
                    <span className="text-[11px] text-zinc-400">Alerts when session finishes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notificationStatus !== 'granted' ? (
                    <button
                      onClick={handleRequestNotification}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95"
                    >
                      Enable
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleTestNotification}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-700/60 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        Test
                      </button>
                      <input
                        type="checkbox"
                        checked={settings.notificationEnabled}
                        onChange={(e) => onUpdateSettings({ notificationEnabled: e.target.checked })}
                        className="w-4 h-4 rounded accent-rose-500 cursor-pointer ml-1"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Theme */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Theme
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-zinc-800/40 p-1.5 rounded-xl border border-zinc-800/60">
              {(['dark', 'light', 'system'] as AppTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => onUpdateSettings({ theme: thm })}
                  className={`py-2 rounded-lg text-xs font-medium capitalize transition ${
                    settings.theme === thm
                      ? 'bg-zinc-700 text-zinc-100 font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {thm}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Android APK Releases */}
          <div className="pt-2 border-t border-zinc-800/80">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-2">
              Android Universal APK
            </h3>
            <a
              href="https://github.com/xMrCrypt1c/FocusTimerX/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/60 transition group text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block group-hover:text-white">
                    Download FocusTimerX.apk
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    1-Click download from GitHub Releases
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
