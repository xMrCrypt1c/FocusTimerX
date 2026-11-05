import React from 'react';
import { SyncStatus } from '../types';

interface SyncIndicatorProps {
  status: SyncStatus;
  showText?: boolean;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, showText = false }) => {
  const config = {
    synced: {
      dotColor: 'bg-emerald-500 shadow-sm shadow-emerald-500/50',
      textColor: 'text-emerald-500',
      label: 'Synced',
      tooltip: 'Real-time multi-device sync active via Cloud Firestore',
    },
    syncing: {
      dotColor: 'bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50',
      textColor: 'text-amber-400',
      label: 'Syncing',
      tooltip: 'Syncing changes to cloud...',
    },
    offline: {
      dotColor: 'bg-zinc-500',
      textColor: 'text-zinc-400',
      label: 'Local',
      tooltip: 'Local session active — Sign in with Google to sync in real time across devices',
    },
  }[status];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors cursor-help"
      title={config.tooltip}
      aria-label={config.tooltip}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${config.dotColor}`} />
      {showText && <span className={`text-[11px] font-medium ${config.textColor}`}>{config.label}</span>}
    </div>
  );
};
