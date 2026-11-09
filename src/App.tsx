import { useEffect, useState } from 'react';
import { CircularTimer } from './components/CircularTimer';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { NotificationPermissionModal } from './components/NotificationPermissionModal';
import { SessionLabelInput } from './components/SessionLabelInput';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { useAudio } from './hooks/useAudio';
import { useAuth } from './hooks/useAuth';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useTimerSync } from './hooks/useTimerSync';
import { useWakeLock } from './hooks/useWakeLock';

export default function App() {
  const { user, isAnonymous, signInWithGoogle, signOutUser } = useAuth();
  const isOnline = useOnlineStatus();
  const { playCompletionSound, playClickSound } = useAudio();

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationPromptState, setNotificationPromptState] = useState<{
    isOpen: boolean;
    pending: { title: string; body: string } | null;
  }>({
    isOpen: false,
    pending: null,
  });

  // Core Timer & Firestore Real-Time Sync Hook
  const {
    timerState,
    settings,
    sessions,
    syncStatus,
    displayRemainingMs,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    switchMode,
    applyPreset,
    setSessionLabel,
    updateSettings,
    statsSummary,
  } = useTimerSync(
    user?.uid,
    isOnline,
    () => playCompletionSound(settings.soundEnabled),
    (pending) => setNotificationPromptState({ isOpen: true, pending })
  );

  // Keep screen awake while timer is running
  useWakeLock(timerState.status === 'running');

  // Theme synchronization (dark / light / system)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Global Keyboard Shortcuts (Space = play/pause, R = reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playClickSound(settings.soundEnabled);
        if (timerState.status === 'running') {
          pauseTimer();
        } else if (timerState.status === 'paused') {
          resumeTimer();
        } else {
          startTimer();
        }
      } else if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        playClickSound(settings.soundEnabled);
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState.status, settings.soundEnabled, startTimer, pauseTimer, resumeTimer, resetTimer, playClickSound]);

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] transition-colors duration-300">
      {/* Top Header */}
      <Header
        user={user}
        isAnonymous={isAnonymous}
        syncStatus={syncStatus}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignInGoogle={signInWithGoogle}
        onSignOut={signOutUser}
      />

      {/* Main Focus Area (Hero countdown + controls) */}
      <main className="flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-2 sm:py-6 max-w-xl mx-auto w-full">
        {/* Optional Session Label & Daily Goal / Streak Glance */}
        <div className="w-full flex flex-col items-center gap-2 pt-2">
          <SessionLabelInput
            label={timerState.sessionLabel}
            onUpdateLabel={setSessionLabel}
          />

          {/* Minimalist Goal & Streak Tracker Badge */}
          <button
            onClick={() => setIsStatsOpen(true)}
            className="group inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Click to view detailed stats and history"
          >
            <span className="flex items-center gap-1 text-amber-400">
              <span>🔥</span>
              <strong className="text-zinc-200 font-semibold">{statsSummary.currentStreakDays}</strong>
              <span className="text-zinc-500">{statsSummary.currentStreakDays === 1 ? 'day' : 'days'}</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1">
              <span className="text-rose-400 font-mono">{statsSummary.todayFocusMinutes}</span>
              <span className="text-zinc-500">/</span>
              <span className="font-mono text-zinc-400">{statsSummary.dailyGoalMinutes}m goal</span>
            </span>
            {statsSummary.isDailyGoalMet && (
              <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                ✓ Goal Met
              </span>
            )}
          </button>
        </div>

        {/* Hero Centered Circular Countdown */}
        <div className="my-auto py-2 sm:py-6">
          <CircularTimer
            remainingMs={displayRemainingMs}
            totalDurationMs={timerState.durationMs}
            mode={timerState.mode}
            status={timerState.status}
            completedSessionsCount={timerState.completedSessionsCount}
            longBreakInterval={settings.longBreakInterval}
          />
        </div>

        {/* Primary Controls & Mode Switcher */}
        <Controls
          status={timerState.status}
          mode={timerState.mode}
          presetName={timerState.presetName || 'pomodoro'}
          onStart={() => {
            playClickSound(settings.soundEnabled);
            startTimer();
          }}
          onPause={() => {
            playClickSound(settings.soundEnabled);
            pauseTimer();
          }}
          onResume={() => {
            playClickSound(settings.soundEnabled);
            resumeTimer();
          }}
          onReset={() => {
            playClickSound(settings.soundEnabled);
            resetTimer();
          }}
          onSkip={() => {
            playClickSound(settings.soundEnabled);
            skipTimer();
          }}
          onSwitchMode={(mode) => {
            playClickSound(settings.soundEnabled);
            switchMode(mode);
          }}
          onApplyPreset={(preset) => {
            playClickSound(settings.soundEnabled);
            applyPreset(preset);
          }}
        />

        {/* Quiet Keyboard Hint on Desktop */}
        <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-600 font-mono tracking-tight pb-2">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Space</kbd> Start / Pause
          </span>
          <span>·</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">R</kbd> Reset
          </span>
        </div>
      </main>

      {/* Offline Toast if disconnected */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/90 text-zinc-300 text-xs border border-zinc-700/60 shadow-lg backdrop-blur-xs"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Offline — Timer running with local cache</span>
        </aside>
      )}

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={statsSummary}
        recentSessions={sessions}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onPlayTestSound={() => playCompletionSound(true)}
      />

      {/* Permission Request Modal on Session Completion */}
      <NotificationPermissionModal
        isOpen={notificationPromptState.isOpen}
        onClose={() => setNotificationPromptState({ isOpen: false, pending: null })}
        onPermissionGranted={() => updateSettings({ notificationEnabled: true })}
        pendingNotification={notificationPromptState.pending}
      />
    </div>
  );
}
