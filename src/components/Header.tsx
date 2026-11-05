import React, { useState } from 'react';
import { BarChart3, LogIn, LogOut, Settings, Volume2, VolumeX } from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncStatus } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { SyncIndicator } from './SyncIndicator';

interface HeaderProps {
  user: User | null;
  isAnonymous: boolean;
  syncStatus: SyncStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAnonymous,
  syncStatus,
  soundEnabled,
  onToggleSound,
  onOpenStats,
  onOpenSettings,
  onSignInGoogle,
  onSignOut,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 select-none">
      {/* Brand & Sync Dot */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-semibold tracking-tight text-base sm:text-lg text-zinc-100">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-0.5" />
          <span>FocusTimerX</span>
        </div>
        <SyncIndicator status={syncStatus} showText={false} />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Quick Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition"
          title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
          aria-label={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-zinc-300" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {/* Stats Button */}
        <button
          onClick={onOpenStats}
          className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition"
          title="Today's Statistics & 7-Day Chart"
          aria-label="View Statistics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition"
          title="Timer & App Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Account / Sync Status Button */}
        <div className="relative">
          {!user || isAnonymous ? (
            <button
              onClick={onSignInGoogle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 bg-zinc-800/70 hover:bg-zinc-700/80 border border-zinc-700/50 transition active:scale-95 ml-1"
              title="Sign in with Google to sync across all your devices"
            >
              <LogIn className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Sync Account</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 hover:border-zinc-500 transition ml-1"
                title={user?.email || 'Account'}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl py-2 z-50 text-xs text-zinc-200">
                    <div className="px-3 py-1.5 border-b border-zinc-800 text-zinc-400 truncate">
                      {user?.email}
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-rose-400 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
