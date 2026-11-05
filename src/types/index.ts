export type TimerStatus = 'idle' | 'running' | 'paused';
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type PresetType = 'pomodoro' | 'fiftyTen' | 'custom';
export type AppTheme = 'light' | 'dark' | 'system';
export type SyncStatus = 'synced' | 'syncing' | 'offline';

export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  durationMs: number;
  targetEndTimestamp: number;
  remainingMs: number;
  sessionLabel?: string;
  presetName?: PresetType;
  completedSessionsCount: number;
  updatedAt: number;
  updatedByDevice?: string;
}

export interface UserSettings {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  theme: AppTheme;
  dailyGoalMinutes?: number;
  dailyGoalSessions?: number;
  updatedAt?: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  label?: string;
  durationMinutes: number;
  completedAt: string;
  dayKey: string; // YYYY-MM-DD
  mode: TimerMode;
}

export interface DailyStat {
  dayKey: string;
  dayLabel: string;
  focusMinutes: number;
  sessionsCount: number;
  isToday: boolean;
  goalMet: boolean;
}

export interface StatsSummary {
  todaySessionsCount: number;
  todayFocusMinutes: number;
  dailyGoalMinutes: number;
  dailyGoalSessions: number;
  dailyGoalProgressPercent: number;
  isDailyGoalMet: boolean;
  currentStreakDays: number;
  bestStreakDays: number;
  allTimeFocusMinutes: number;
  allTimeSessionsCount: number;
  weeklyStats: DailyStat[];
  labelBreakdown: { label: string; minutes: number; count: number }[];
}
