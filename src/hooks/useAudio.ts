import { useRef } from 'react';

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  /**
   * Plays a calm, gentle harmonic chime (528 Hz - Solfeggio focus tone)
   */
  const playCompletionSound = (enabled = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 528 Hz (Warm bell tone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 2.3);

      // Note 2: 792 Hz (Perfect 5th harmonic overtone, delayed by 180ms)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(792, now + 0.18);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.001, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.2, now + 0.24);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.18);
      osc2.stop(now + 2.7);

      // Note 3: 1056 Hz (Octave shimmer, faint)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1056, now + 0.36);

      gain3.gain.setValueAtTime(0.0001, now);
      gain3.gain.setValueAtTime(0.001, now + 0.36);
      gain3.gain.exponentialRampToValueAtTime(0.08, now + 0.42);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.36);
      osc3.stop(now + 2.9);
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e);
    }
  };

  /**
   * Subtle click for button feedback
   */
  const playClickSound = (enabled = true) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore click error
    }
  };

  return { playCompletionSound, playClickSound };
}
