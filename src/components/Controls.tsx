import React from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { PresetType, TimerMode, TimerStatus } from '../types';

interface ControlsProps {
  status: TimerStatus;
  mode: TimerMode;
  presetName: PresetType;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitchMode: (mode: TimerMode) => void;
  onApplyPreset: (preset: PresetType) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  status,
  mode,
  presetName,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  onSwitchMode,
  onApplyPreset,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5 select-none pb-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center p-1 rounded-full bg-zinc-900/80 dark:bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-sm text-xs">
        <button
          onClick={() => onSwitchMode('focus')}
          className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
            mode === 'focus'
              ? 'bg-zinc-800 text-rose-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => onSwitchMode('shortBreak')}
          className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
            mode === 'shortBreak'
              ? 'bg-zinc-800 text-emerald-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => onSwitchMode('longBreak')}
          className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
            mode === 'longBreak'
              ? 'bg-zinc-800 text-cyan-400 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-1">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="group flex flex-col items-center justify-center w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 transition-all active:scale-95 shadow-sm"
          title="Reset Timer (Press R)"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-45" />
          <span className="text-[9px] font-mono mt-0.5 text-zinc-500 group-hover:text-zinc-400">R</span>
        </button>

        {/* Primary Play / Pause Button */}
        <button
          onClick={isRunning ? onPause : isPaused ? onResume : onStart}
          className={`flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-200 active:scale-95 shadow-lg ${
            isRunning
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 hover:shadow-rose-900/50'
          }`}
          title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="group flex flex-col items-center justify-center w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 transition-all active:scale-95 shadow-sm"
          title="Skip to next session"
          aria-label="Skip session"
        >
          <SkipForward className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          <span className="text-[9px] font-mono mt-0.5 text-zinc-500 group-hover:text-zinc-400">skip</span>
        </button>
      </div>

      {/* Preset Selector Chips */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onApplyPreset('pomodoro')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            presetName === 'pomodoro'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
          }`}
        >
          25 / 5
        </button>
        <button
          onClick={() => onApplyPreset('fiftyTen')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            presetName === 'fiftyTen'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
          }`}
        >
          50 / 10
        </button>
        <button
          onClick={() => onApplyPreset('custom')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            presetName === 'custom'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
          }`}
        >
          Custom
        </button>
      </div>
    </div>
  );
};
