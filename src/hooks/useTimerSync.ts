import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  OperationType,
  db,
  handleFirestoreError,
} from '../lib/firebase';
import {
  DailyStat,
  PresetType,
  SessionRecord,
  StatsSummary,
  SyncStatus,
  TimerMode,
  TimerState,
  UserSettings,
} from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationEnabled: true,
  theme: 'system',
  dailyGoalMinutes: 100,
  dailyGoalSessions: 4,
};

const DEFAULT_TIMER_STATE: TimerState = {
  status: 'idle',
  mode: 'focus',
  durationMs: 25 * 60 * 1000,
  targetEndTimestamp: 0,
  remainingMs: 25 * 60 * 1000,
  sessionLabel: '',
  presetName: 'pomodoro',
  completedSessionsCount: 0,
  updatedAt: Date.now(),
};

import {
  dispatchSessionNotification,
  getNotificationPermission,
  triggerDeviceVibration,
} from '../lib/notifications';

function loadStoredState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore error
  }
  return fallback;
}

export function useTimerSync(
  userId: string | undefined,
  isOnline: boolean,
  onSessionCompleteChime?: () => void,
  onRequestNotificationPermission?: (pending: { title: string; body: string }) => void
) {
  // Initialize state with local cache fallback for instant zero-latency loading
  const [timerState, setTimerState] = useState<TimerState>(() =>
    loadStoredState('focustimerx_timer_state', DEFAULT_TIMER_STATE)
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadStoredState('focustimerx_settings', DEFAULT_SETTINGS)
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    loadStoredState('focustimerx_sessions', [])
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(userId ? 'synced' : 'offline');

  // Compute initial remaining ms
  const [displayRemainingMs, setDisplayRemainingMs] = useState<number>(() => {
    const saved = loadStoredState('focustimerx_timer_state', DEFAULT_TIMER_STATE);
    if (saved.status === 'running' && saved.targetEndTimestamp > Date.now()) {
      return Math.max(0, saved.targetEndTimestamp - Date.now());
    }
    return saved.remainingMs || saved.durationMs || 25 * 60 * 1000;
  });

  const stateRef = useRef<TimerState>(timerState);
  stateRef.current = timerState;

  const settingsRef = useRef<UserSettings>(settings);
  settingsRef.current = settings;

  const onSessionCompleteChimeRef = useRef(onSessionCompleteChime);
  onSessionCompleteChimeRef.current = onSessionCompleteChime;

  const onRequestNotificationPermissionRef = useRef(onRequestNotificationPermission);
  onRequestNotificationPermissionRef.current = onRequestNotificationPermission;

  const completingRef = useRef(false);

  // Sync status updates based on connectivity & auth
  useEffect(() => {
    if (!isOnline || !userId) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('synced');
    }
  }, [isOnline, userId]);

  // 1. Listen to Timer State in Firestore (when user is signed in)
  useEffect(() => {
    if (!userId) return;

    const timerDocRef = doc(db, 'users', userId, 'timer', 'state');
    const pathForTimer = `users/${userId}/timer/state`;

    const unsubscribe = onSnapshot(
      timerDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteState = snapshot.data() as TimerState;
          // Apply remote state if it's newer or local is idle
          if (!stateRef.current.updatedAt || remoteState.updatedAt >= stateRef.current.updatedAt) {
            setTimerState(remoteState);
            try {
              localStorage.setItem('focustimerx_timer_state', JSON.stringify(remoteState));
            } catch {}

            if (remoteState.status === 'running') {
              const diff = Math.max(0, remoteState.targetEndTimestamp - Date.now());
              setDisplayRemainingMs(diff);
            } else {
              setDisplayRemainingMs(remoteState.remainingMs);
            }
          }
        } else {
          // Initialize remote timer state document if none exists yet
          const initial = stateRef.current;
          setDoc(timerDocRef, initial).catch((err) => {
            console.warn('Initializing remote timer state:', err);
          });
        }
        setSyncStatus(isOnline ? 'synced' : 'offline');
      },
      (error) => {
        console.warn('Firestore onSnapshot timer listener:', error);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [userId, isOnline]);

  // 2. Listen to User Settings in Firestore
  useEffect(() => {
    if (!userId) return;

    const settingsDocRef = doc(db, 'users', userId, 'settings', 'config');
    const pathForSettings = `users/${userId}/settings/config`;

    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteSettings = snapshot.data() as UserSettings;
          setSettings(remoteSettings);
          try {
            localStorage.setItem('focustimerx_settings', JSON.stringify(remoteSettings));
          } catch {}
        } else {
          setDoc(settingsDocRef, { ...settingsRef.current, updatedAt: Date.now() }).catch((err) => {
            console.warn('Initializing remote settings:', err);
          });
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot settings listener:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // 3. Listen to Sessions history in Firestore
  useEffect(() => {
    if (!userId) return;

    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const sessionsQ = query(sessionsCol, orderBy('completedAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      sessionsQ,
      (snapshot) => {
        const list: SessionRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SessionRecord);
        });
        setSessions(list);
        try {
          localStorage.setItem('focustimerx_sessions', JSON.stringify(list));
        } catch {}
      },
      (error) => {
        console.warn('Firestore onSnapshot sessions listener:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Helper to persist timer state (always updates locally; syncs to Firestore if userId present)
  const persistTimerState = useCallback(
    async (nextState: Partial<TimerState>) => {
      const merged: TimerState = {
        ...stateRef.current,
        ...nextState,
        updatedAt: Date.now(),
        updatedByDevice: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) : 'unknown',
      };

      // 1. Always update local state immediately
      setTimerState(merged);
      try {
        localStorage.setItem('focustimerx_timer_state', JSON.stringify(merged));
      } catch {}

      // 2. If user is authenticated, sync to Firestore
      if (userId && isOnline) {
        setSyncStatus('syncing');
        try {
          const timerDocRef = doc(db, 'users', userId, 'timer', 'state');
          await setDoc(timerDocRef, merged);
          setSyncStatus('synced');
        } catch (err) {
          console.warn('Firestore write warning:', err);
          setSyncStatus('offline');
        }
      } else {
        setSyncStatus('offline');
      }
    },
    [userId, isOnline]
  );

  // Helper to persist settings
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const merged: UserSettings = {
        ...settingsRef.current,
        ...newSettings,
        updatedAt: Date.now(),
      };
      setSettings(merged);
      try {
        localStorage.setItem('focustimerx_settings', JSON.stringify(merged));
      } catch {}

      if (!userId || !isOnline) return;

      try {
        const settingsDocRef = doc(db, 'users', userId, 'settings', 'config');
        await setDoc(settingsDocRef, merged);
      } catch (err) {
        console.warn('Firestore settings write warning:', err);
      }
    },
    [userId, isOnline]
  );

  // Handle Session Completion Flow
  const handleSessionComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;

    const current = stateRef.current;
    const currentSettings = settingsRef.current;

    // 1. Vibration and Sound
    triggerDeviceVibration([250, 100, 250]);

    if (currentSettings.soundEnabled && onSessionCompleteChimeRef.current) {
      onSessionCompleteChimeRef.current();
    }

    const modeLabels: Record<TimerMode, string> = {
      focus: 'Focus Session Complete!',
      shortBreak: 'Short Break Ended',
      longBreak: 'Long Break Ended',
    };
    const modeBodies: Record<TimerMode, string> = {
      focus: 'Great job! Take a well-deserved break.',
      shortBreak: 'Break is over. Ready to focus again?',
      longBreak: 'Long break finished. Ready for a new cycle?',
    };

    const notifTitle = modeLabels[current.mode];
    const notifBody = modeBodies[current.mode];

    // Notification handling respecting settings and permission state
    if (currentSettings.notificationEnabled) {
      const permission = getNotificationPermission();
      if (permission === 'granted') {
        dispatchSessionNotification(notifTitle, notifBody);
      } else if (permission === 'default') {
        // Trigger permission request prompt on session completion!
        if (onRequestNotificationPermissionRef.current) {
          onRequestNotificationPermissionRef.current({ title: notifTitle, body: notifBody });
        }
      }
    }

    // 2. Record Session if mode was focus
    if (current.mode === 'focus') {
      const now = new Date();
      const dayKey = now.toISOString().slice(0, 10);
      const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const durationMinutes = Math.max(1, Math.round(current.durationMs / (60 * 1000)));

      const newRecord: SessionRecord = {
        id: sessionId,
        userId: userId || 'local_user',
        label: current.sessionLabel || 'Focus',
        durationMinutes,
        completedAt: now.toISOString(),
        dayKey,
        mode: 'focus',
      };

      setSessions((prev) => {
        const updated = [newRecord, ...prev];
        try {
          localStorage.setItem('focustimerx_sessions', JSON.stringify(updated.slice(0, 100)));
        } catch {}
        return updated;
      });

      if (userId && isOnline) {
        try {
          const sesDocRef = doc(db, 'users', userId, 'sessions', sessionId);
          await setDoc(sesDocRef, newRecord);
        } catch (err) {
          console.warn('Failed to log completed session to Firestore:', err);
        }
      }
    }

    // 3. Determine next cycle mode and next duration
    let nextMode: TimerMode = 'focus';
    let nextCount = current.completedSessionsCount;
    let nextDurationMs = currentSettings.focusDurationMinutes * 60 * 1000;
    let autoStartNext = false;

    if (current.mode === 'focus') {
      nextCount = current.completedSessionsCount + 1;
      const shouldLongBreak = nextCount % currentSettings.longBreakInterval === 0;
      if (shouldLongBreak) {
        nextMode = 'longBreak';
        nextDurationMs = currentSettings.longBreakDurationMinutes * 60 * 1000;
      } else {
        nextMode = 'shortBreak';
        nextDurationMs = currentSettings.shortBreakDurationMinutes * 60 * 1000;
      }
      autoStartNext = currentSettings.autoStartBreaks;
    } else {
      nextMode = 'focus';
      nextDurationMs = currentSettings.focusDurationMinutes * 60 * 1000;
      autoStartNext = currentSettings.autoStartFocus;
    }

    const nextTarget = autoStartNext ? Date.now() + nextDurationMs : 0;
    const nextStatus = autoStartNext ? 'running' : 'idle';

    await persistTimerState({
      status: nextStatus,
      mode: nextMode,
      durationMs: nextDurationMs,
      targetEndTimestamp: nextTarget,
      remainingMs: nextDurationMs,
      completedSessionsCount: nextCount,
    });

    setDisplayRemainingMs(nextDurationMs);
    completingRef.current = false;
  }, [userId, isOnline, persistTimerState]);

  // 4. Local High-Resolution Countdown Interval
  useEffect(() => {
    if (timerState.status !== 'running') {
      setDisplayRemainingMs(timerState.remainingMs);
      return;
    }

    const updateTick = () => {
      const target = timerState.targetEndTimestamp;
      const now = Date.now();
      const remaining = Math.max(0, target - now);
      setDisplayRemainingMs(remaining);

      if (remaining <= 0) {
        handleSessionComplete();
      }
    };

    updateTick();
    const interval = setInterval(updateTick, 200);

    return () => clearInterval(interval);
  }, [timerState.status, timerState.targetEndTimestamp, timerState.remainingMs, handleSessionComplete]);

  // 5. Browser Tab Title Synchronization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const totalSec = Math.ceil(displayRemainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerState.status === 'running') {
      document.title = `${timeFormatted} · FocusTimerX`;
    } else if (timerState.status === 'paused') {
      document.title = `⏸ ${timeFormatted} · FocusTimerX`;
    } else {
      document.title = 'FocusTimerX · Minimalist Focus Timer';
    }
  }, [displayRemainingMs, timerState.status]);

  // Control Actions (Immediate execution, zero delay)
  const startTimer = useCallback(() => {
    const current = stateRef.current;
    const remaining = current.remainingMs > 0 ? current.remainingMs : current.durationMs;
    const targetEnd = Date.now() + remaining;
    setDisplayRemainingMs(remaining);
    persistTimerState({
      status: 'running',
      remainingMs: remaining,
      targetEndTimestamp: targetEnd,
    });
  }, [persistTimerState]);

  const pauseTimer = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== 'running') return;
    const remaining = Math.max(0, current.targetEndTimestamp - Date.now());
    setDisplayRemainingMs(remaining);
    persistTimerState({
      status: 'paused',
      remainingMs: remaining,
      targetEndTimestamp: 0,
    });
  }, [persistTimerState]);

  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const resetTimer = useCallback(() => {
    const current = stateRef.current;
    setDisplayRemainingMs(current.durationMs);
    persistTimerState({
      status: 'idle',
      remainingMs: current.durationMs,
      targetEndTimestamp: 0,
    });
  }, [persistTimerState]);

  const skipTimer = useCallback(() => {
    const current = stateRef.current;
    const currentSettings = settingsRef.current;
    let nextMode: TimerMode = 'focus';
    let nextDuration = currentSettings.focusDurationMinutes * 60 * 1000;

    if (current.mode === 'focus') {
      const nextCount = current.completedSessionsCount + 1;
      const shouldLong = nextCount % currentSettings.longBreakInterval === 0;
      nextMode = shouldLong ? 'longBreak' : 'shortBreak';
      nextDuration =
        (shouldLong
          ? currentSettings.longBreakDurationMinutes
          : currentSettings.shortBreakDurationMinutes) *
        60 *
        1000;
    }

    setDisplayRemainingMs(nextDuration);
    persistTimerState({
      status: 'idle',
      mode: nextMode,
      durationMs: nextDuration,
      remainingMs: nextDuration,
      targetEndTimestamp: 0,
    });
  }, [persistTimerState]);

  const switchMode = useCallback(
    (mode: TimerMode) => {
      const s = settingsRef.current;
      let dur = s.focusDurationMinutes * 60 * 1000;
      if (mode === 'shortBreak') dur = s.shortBreakDurationMinutes * 60 * 1000;
      if (mode === 'longBreak') dur = s.longBreakDurationMinutes * 60 * 1000;

      setDisplayRemainingMs(dur);
      persistTimerState({
        status: 'idle',
        mode,
        durationMs: dur,
        remainingMs: dur,
        targetEndTimestamp: 0,
      });
    },
    [persistTimerState]
  );

  const applyPreset = useCallback(
    (preset: PresetType) => {
      let focusMins = 25;
      let breakMins = 5;

      if (preset === 'pomodoro') {
        focusMins = 25;
        breakMins = 5;
      } else if (preset === 'fiftyTen') {
        focusMins = 50;
        breakMins = 10;
      } else if (preset === 'custom') {
        focusMins = settingsRef.current.focusDurationMinutes;
        breakMins = settingsRef.current.shortBreakDurationMinutes;
      }

      updateSettings({
        focusDurationMinutes: focusMins,
        shortBreakDurationMinutes: breakMins,
      });

      const currentMode = stateRef.current.mode;
      const targetMins = currentMode === 'focus' ? focusMins : breakMins;
      const durationMs = targetMins * 60 * 1000;

      setDisplayRemainingMs(durationMs);
      persistTimerState({
        presetName: preset,
        status: 'idle',
        durationMs,
        remainingMs: durationMs,
        targetEndTimestamp: 0,
      });
    },
    [updateSettings, persistTimerState]
  );

  const setSessionLabel = useCallback(
    (label: string) => {
      persistTimerState({ sessionLabel: label.slice(0, 60) });
    },
    [persistTimerState]
  );

  // Compute Statistics, Daily Goal & Streak Tracking
  const getStatsSummary = useCallback((): StatsSummary => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentSettings = settingsRef.current;
    const dailyGoalMinutes = currentSettings.dailyGoalMinutes || 100;
    const dailyGoalSessions = currentSettings.dailyGoalSessions || 4;

    const days: DailyStat[] = [];
    const statsMap: Record<string, { minutes: number; count: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = dayNames[d.getDay()];
      days.push({
        dayKey: key,
        dayLabel: label,
        focusMinutes: 0,
        sessionsCount: 0,
        isToday: key === todayStr,
        goalMet: false,
      });
      statsMap[key] = { minutes: 0, count: 0 };
    }

    let todaySessionsCount = 0;
    let todayFocusMinutes = 0;
    let allTimeFocusMinutes = 0;
    let allTimeSessionsCount = 0;
    const labelMap: Record<string, { minutes: number; count: number }> = {};

    sessions.forEach((ses) => {
      if (ses.mode === 'focus') {
        allTimeFocusMinutes += ses.durationMinutes;
        allTimeSessionsCount += 1;

        const tag = ses.label?.trim() || 'General Focus';
        if (!labelMap[tag]) {
          labelMap[tag] = { minutes: 0, count: 0 };
        }
        labelMap[tag].minutes += ses.durationMinutes;
        labelMap[tag].count += 1;
      }

      if (statsMap[ses.dayKey] && ses.mode === 'focus') {
        statsMap[ses.dayKey].minutes += ses.durationMinutes;
        statsMap[ses.dayKey].count += 1;
      }
      if (ses.dayKey === todayStr && ses.mode === 'focus') {
        todaySessionsCount += 1;
        todayFocusMinutes += ses.durationMinutes;
      }
    });

    days.forEach((day) => {
      day.focusMinutes = statsMap[day.dayKey]?.minutes || 0;
      day.sessionsCount = statsMap[day.dayKey]?.count || 0;
      day.goalMet = day.focusMinutes >= dailyGoalMinutes || day.sessionsCount >= dailyGoalSessions;
    });

    // Compute current active streak
    let currentStreakDays = 0;
    const now = new Date();
    for (let offset = 0; offset < 365; offset++) {
      const checkDate = new Date();
      checkDate.setDate(now.getDate() - offset);
      const checkKey = checkDate.toISOString().slice(0, 10);
      const hasSession = sessions.some((s) => s.dayKey === checkKey && s.mode === 'focus');
      if (hasSession) {
        currentStreakDays++;
      } else {
        // If today has no completed session yet, allow yesterday's active streak to continue
        if (offset === 0) continue;
        break;
      }
    }

    // Compute all-time best streak
    // Collect all unique dates with focus sessions sorted ascending
    const activeDates = Array.from(
      new Set(sessions.filter((s) => s.mode === 'focus').map((s) => s.dayKey))
    ).sort();

    let bestStreakDays = currentStreakDays;
    let runningStreak = 0;
    let prevEpochDay: number | null = null;

    activeDates.forEach((dateStr) => {
      const epochDay = Math.floor(new Date(dateStr).getTime() / (86400 * 1000));
      if (prevEpochDay === null) {
        runningStreak = 1;
      } else if (epochDay === prevEpochDay + 1) {
        runningStreak += 1;
      } else if (epochDay > prevEpochDay + 1) {
        runningStreak = 1;
      }
      prevEpochDay = epochDay;
      if (runningStreak > bestStreakDays) {
        bestStreakDays = runningStreak;
      }
    });

    // Format label breakdown sorted by minutes
    const labelBreakdown = Object.entries(labelMap)
      .map(([label, data]) => ({
        label,
        minutes: data.minutes,
        count: data.count,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    const isDailyGoalMet = todayFocusMinutes >= dailyGoalMinutes || todaySessionsCount >= dailyGoalSessions;
    const dailyGoalProgressPercent = Math.min(
      100,
      Math.round((todayFocusMinutes / Math.max(1, dailyGoalMinutes)) * 100)
    );

    return {
      todaySessionsCount,
      todayFocusMinutes,
      dailyGoalMinutes,
      dailyGoalSessions,
      dailyGoalProgressPercent,
      isDailyGoalMet,
      currentStreakDays,
      bestStreakDays,
      allTimeFocusMinutes,
      allTimeSessionsCount,
      weeklyStats: days,
      labelBreakdown,
    };
  }, [sessions]);

  return {
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
    statsSummary: getStatsSummary(),
  };
}
