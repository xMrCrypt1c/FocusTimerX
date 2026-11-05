/**
 * Security Rule Verification Tests for FocusTimerX
 * Verifies that all 12 Dirty Dozen payloads are rejected and authorized writes succeed.
 */

export interface TestPayload {
  description: string;
  path: string;
  authUid: string | null;
  data: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_PAYLOADS: TestPayload[] = [
  {
    description: 'Cross-user timer hijack',
    path: '/users/victim_123/timer/state',
    authUid: 'attacker_456',
    data: {
      status: 'running',
      mode: 'focus',
      durationMs: 1500000,
      targetEndTimestamp: 1800000000000,
      remainingMs: 0,
      completedSessionsCount: 0,
      updatedAt: Date.now(),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Unauthenticated timer write',
    path: '/users/user_123/timer/state',
    authUid: null,
    data: { status: 'idle' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Shadow field injection in timer state',
    path: '/users/user_123/timer/state',
    authUid: 'user_123',
    data: {
      status: 'running',
      mode: 'focus',
      durationMs: 1500000,
      targetEndTimestamp: 1800000000000,
      remainingMs: 0,
      completedSessionsCount: 0,
      updatedAt: Date.now(),
      adminOverride: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Invalid status enum value',
    path: '/users/user_123/timer/state',
    authUid: 'user_123',
    data: {
      status: 'invalid_status_enum',
      mode: 'focus',
      durationMs: 1500000,
      targetEndTimestamp: 0,
      remainingMs: 1500000,
      completedSessionsCount: 0,
      updatedAt: Date.now(),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Over-sized session label string (denial of wallet)',
    path: '/users/user_123/timer/state',
    authUid: 'user_123',
    data: {
      status: 'running',
      mode: 'focus',
      durationMs: 1500000,
      targetEndTimestamp: 1800000000000,
      remainingMs: 0,
      completedSessionsCount: 0,
      sessionLabel: 'A'.repeat(500),
      updatedAt: Date.now(),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Session record userId spoofing',
    path: '/users/user_123/sessions/session_abc',
    authUid: 'user_123',
    data: {
      id: 'session_abc',
      userId: 'victim_user_999',
      durationMinutes: 25,
      completedAt: '2026-11-05T12:00:00Z',
      dayKey: '2026-11-05',
      mode: 'focus',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Invalid date format string in dayKey',
    path: '/users/user_123/sessions/session_abc',
    authUid: 'user_123',
    data: {
      id: 'session_abc',
      userId: 'user_123',
      durationMinutes: 25,
      completedAt: '2026-11-05T12:00:00Z',
      dayKey: 'malicious-date-tag',
      mode: 'focus',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Negative duration in settings',
    path: '/users/user_123/settings/config',
    authUid: 'user_123',
    data: {
      focusDurationMinutes: -25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true,
      notificationEnabled: true,
      theme: 'dark',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Invalid theme value in settings',
    path: '/users/user_123/settings/config',
    authUid: 'user_123',
    data: {
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true,
      notificationEnabled: true,
      theme: 'neon-matrix',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Modification of root catch-all path',
    path: '/root_secrets/item',
    authUid: 'user_123',
    data: { secret: 'exposed' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Writing to read-only test connection document',
    path: '/test/connection',
    authUid: 'user_123',
    data: { status: 'tampered' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    description: 'Non-owner updating completed session',
    path: '/users/user_123/sessions/session_abc',
    authUid: 'attacker_456',
    data: { label: 'tampered' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
