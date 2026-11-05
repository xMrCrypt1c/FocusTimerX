import React from 'react';
import { TimerMode, TimerStatus } from '../types';

interface CircularTimerProps {
  remainingMs: number;
  totalDurationMs: number;
  mode: TimerMode;
  status: TimerStatus;
  completedSessionsCount: number;
  longBreakInterval: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingMs,
  totalDurationMs,
  mode,
  status,
  completedSessionsCount,
  longBreakInterval,
}) => {
  // Format MM:SS with tabular digits
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Calculate SVG Circle Progress
  // Safe clamped progress between 0 and 1
  const progressRatio = totalDurationMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalDurationMs)) : 1;

  // SVG dimensions
  const size = 320; // ViewBox size
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Offset: 0 is full, circumference is empty
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Dynamic accent colors based on mode
  const modeTheme = {
    focus: {
      strokeColor: '#f43f5e', // Rose
      glowColor: 'rgba(244, 63, 94, 0.15)',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      label: 'Focus',
    },
    shortBreak: {
      strokeColor: '#10b981', // Emerald
      glowColor: 'rgba(16, 185, 129, 0.15)',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Short Break',
    },
    longBreak: {
      strokeColor: '#06b6d4', // Cyan
      glowColor: 'rgba(6, 182, 212, 0.15)',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      label: 'Long Break',
    },
  }[mode];

  // Cycle dots (1 to 4 sessions in cycle)
  const currentInCycle = completedSessionsCount % longBreakInterval;

  return (
    <div className="relative flex flex-col items-center justify-center my-auto select-none">
      {/* Outer Glow container */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        {/* Ambient Subtle Glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 pointer-events-none"
          style={{
            backgroundColor: modeTheme.glowColor,
            opacity: status === 'running' ? 0.9 : 0.25,
          }}
        />

        {/* Circular SVG Ring */}
        <svg
          className="w-full h-full -rotate-90 transform drop-shadow-sm"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-800/80 dark:text-zinc-800/60 transition-colors"
          />

          {/* Active Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={modeTheme.strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Inner Content Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {/* Mode Badge */}
          <div className="mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase border ${modeTheme.badgeBg} transition-colors`}
            >
              {status === 'running' && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              )}
              {status === 'paused' && <span className="text-[10px]">⏸</span>}
              {modeTheme.label}
            </span>
          </div>

          {/* Large Tabular Numbers */}
          <div className="tabular-numbers text-6xl sm:text-7xl md:text-8xl font-light tracking-tighter text-zinc-900 dark:text-zinc-50 flex items-baseline justify-center">
            <span>{formattedMinutes}</span>
            <span className={`mx-0.5 sm:mx-1 transition-opacity duration-500 ${status === 'running' ? 'animate-pulse' : 'opacity-70'}`}>
              :
            </span>
            <span>{formattedSeconds}</span>
          </div>

          {/* Cycle Dots (e.g. 4 dots indicating progress toward long break) */}
          <div
            className="flex items-center gap-2 mt-4"
            title={`Session ${currentInCycle} of ${longBreakInterval} in current cycle`}
            aria-label={`Cycle progress: ${currentInCycle} of ${longBreakInterval}`}
          >
            {Array.from({ length: longBreakInterval }).map((_, idx) => {
              const isDone = idx < currentInCycle;
              return (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-rose-500 scale-110'
                      : 'bg-zinc-700/60 dark:bg-zinc-700/40'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
