import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, do not show install CTA
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60 shadow-sm active:scale-95"
        title="Install FocusTimerX on your device"
      >
        <Download className="w-3.5 h-3.5 text-rose-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60 shadow-sm active:scale-95"
          title="Install on iOS Home Screen"
        >
          <Download className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-semibold text-zinc-100">Install FocusTimerX</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-medium text-rose-400 shrink-0">
                    1
                  </div>
                  <p>
                    Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share2 className="w-3.5 h-3.5 inline" /></strong> button in Safari's bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-medium text-rose-400 shrink-0">
                    2
                  </div>
                  <p>
                    Scroll down and select <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-medium text-rose-400 shrink-0">
                    3
                  </div>
                  <p>
                    Launch from your Home Screen for a native standalone fullscreen experience.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-sm font-medium text-zinc-200 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
