import React from 'react';
import { Award, CheckCircle2, Clock, Flame, PieChart, Sparkles, Target, Trophy, X } from 'lucide-react';
import { SessionRecord, StatsSummary } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsSummary;
  recentSessions: SessionRecord[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  recentSessions,
}) => {
  if (!isOpen) return null;

  // Compute maximum minutes in weekly stats to scale chart bars nicely
  const maxMins = Math.max(30, ...stats.weeklyStats.map((d) => d.focusMinutes));

  // Format focus minutes into "Xh Ym"
  const formatHoursMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const todayTimeDisplay = formatHoursMinutes(stats.todayFocusMinutes);
  const allTimeDisplay = formatHoursMinutes(stats.allTimeFocusMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 max-h-[88vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-label="Focus & Goal Statistics"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Focus & Goal Stats
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Persisted and synchronized across all your devices</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Daily Goal Progress Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Daily Goal
              </span>
            </div>
            {stats.isDailyGoalMet ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Goal Reached! 🎉
              </span>
            ) : (
              <span className="text-xs font-medium text-zinc-400">
                {stats.dailyGoalProgressPercent}% Complete
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-numbers text-white">
                {todayTimeDisplay}
              </span>
              <span className="text-xs text-zinc-400">
                / {stats.dailyGoalMinutes}m goal
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              <strong className="text-zinc-200">{stats.todaySessionsCount}</strong> of{' '}
              {stats.dailyGoalSessions} sessions
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden mt-2.5">
            <div
              style={{ width: `${stats.dailyGoalProgressPercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                stats.isDailyGoalMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-sm shadow-rose-500/50'
              }`}
            />
          </div>
        </div>

        {/* 2. Three Metric Cards: Streak, Today, All-Time */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {/* Day Streak */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <div className="flex items-center gap-1 mb-1 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span className="text-xs font-medium">Streak</span>
            </div>
            <span className="text-xl font-bold tabular-numbers text-white">
              {stats.currentStreakDays} {stats.currentStreakDays === 1 ? 'day' : 'days'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              Best: {stats.bestStreakDays} {stats.bestStreakDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Today's Completed Sessions */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <div className="flex items-center gap-1 mb-1 text-emerald-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Today</span>
            </div>
            <span className="text-xl font-bold tabular-numbers text-white">
              {stats.todaySessionsCount}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              {stats.todayFocusMinutes} minutes
            </span>
          </div>

          {/* All-Time Focus */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <div className="flex items-center gap-1 mb-1 text-cyan-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">All Time</span>
            </div>
            <span className="text-xl font-bold tabular-numbers text-white">
              {allTimeDisplay}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              {stats.allTimeSessionsCount} sessions
            </span>
          </div>
        </div>

        {/* 3. 7-Day Activity Bar Chart */}
        <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800 my-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-zinc-300">Last 7 Days Activity</span>
            <span className="text-zinc-500 font-mono text-[11px]">Daily Minutes & Goals</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-28 pt-4">
            {stats.weeklyStats.map((item) => {
              const heightPercent = Math.max(6, Math.round((item.focusMinutes / maxMins) * 100));
              return (
                <div key={item.dayKey} className="flex-1 flex flex-col items-center gap-1.5 group">
                  {/* Tooltip on hover */}
                  <span className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.focusMinutes}m
                  </span>
                  {/* Bar */}
                  <div className="w-full max-w-[28px] h-20 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-md transition-all duration-300 relative ${
                        item.goalMet
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-900/50'
                          : item.isToday
                          ? 'bg-rose-500 shadow-sm shadow-rose-900/50'
                          : item.focusMinutes > 0
                          ? 'bg-zinc-700 hover:bg-zinc-600'
                          : 'bg-zinc-800/60'
                      }`}
                    >
                      {item.goalMet && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px]">
                          ⭐
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Day Label */}
                  <span
                    className={`text-[11px] font-medium ${
                      item.isToday
                        ? 'text-rose-400 font-bold'
                        : item.goalMet
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    {item.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Focus Breakdown by Label */}
        {stats.labelBreakdown.length > 0 && (
          <div className="my-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-zinc-400" />
              Focus by Category
            </h3>
            <div className="space-y-2">
              {stats.labelBreakdown.slice(0, 5).map((item) => {
                const percent = Math.round((item.minutes / Math.max(1, stats.allTimeFocusMinutes)) * 100);
                return (
                  <div key={item.label} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-zinc-200">{item.label}</span>
                      <span className="font-mono text-zinc-400">
                        {formatHoursMinutes(item.minutes)} ({item.count} ses)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-rose-500/80"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Today's Session Log */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-2.5">
            Today's Completed Sessions
          </h3>

          {recentSessions.length === 0 ? (
            <div className="py-5 text-center text-xs text-zinc-500 bg-zinc-800/20 rounded-xl border border-zinc-800/40">
              No sessions completed yet today. Start your first session!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {recentSessions.slice(0, 10).map((ses) => {
                const time = new Date(ses.completedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={ses.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="font-medium text-zinc-200">{ses.label || 'Focus Session'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-zinc-400">
                      <span>{ses.durationMinutes}m</span>
                      <span className="text-zinc-600">·</span>
                      <span>{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
