# Security Specification: FocusTimerX

## 1. Data Invariants
1. **User Isolation**: A user can strictly read and write only documents located under `/users/{request.auth.uid}/...`.
2. **Identity Invariant**: The path parameter `{userId}` must match `request.auth.uid`. Cross-user inspection, modification, or deletion is prohibited.
3. **Timer State Integrity**:
   - `status` must only transition between `"idle"`, `"running"`, and `"paused"`.
   - `durationMs` must be positive.
   - `targetEndTimestamp` must be a valid number.
   - When updating timer state, no unauthorized extra fields can be injected.
4. **Settings Integrity**:
   - Durations (`focusDurationMinutes`, `shortBreakDurationMinutes`, `longBreakDurationMinutes`) must be positive numbers within bounds (e.g., 1 to 180).
   - `theme` must be one of `"light"`, `"dark"`, `"system"`.
5. **Session Records Integrity**:
   - `userId` field within the session record payload must strictly match `request.auth.uid`.
   - `durationMinutes` must be greater than 0 and bounded.
   - `dayKey` must match the regex `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`.
   - Session records are append-only (cannot be arbitrarily altered after write).
6. **Public Safety Net**:
   - All other unmapped collections are default-deny (`match /{document=**} { allow read, write: if false; }`).
   - `/test/connection` is read-only for authenticated and public health verification.

---

## 2. The "Dirty Dozen" Payloads (Designed to Fail)

1. **Payload 1 (Identity Spoofing - Cross-User Timer Hijack)**:
   - Target: `/users/victim_user_123/timer/state`
   - User: `attacker_456`
   - Data: `{"status": "running", "targetEndTimestamp": 9999999999, "remainingMs": 0, "mode": "focus", "durationMs": 1500000, "completedSessionsCount": 0, "updatedAt": 1700000000000}`
   - Expected: `PERMISSION_DENIED`

2. **Payload 2 (Unauthenticated Timer Write)**:
   - Target: `/users/anon_or_user_123/timer/state`
   - User: `null` (unauthenticated)
   - Data: `{"status": "idle"}`
   - Expected: `PERMISSION_DENIED`

3. **Payload 3 (Shadow Field Injection in Timer State)**:
   - Target: `/users/user_123/timer/state`
   - User: `user_123`
   - Data: `{"status": "running", "targetEndTimestamp": 1800000000000, "remainingMs": 0, "mode": "focus", "durationMs": 1500000, "completedSessionsCount": 0, "updatedAt": 1700000000000, "adminOverride": true}`
   - Expected: `PERMISSION_DENIED` (Strict keys violation)

4. **Payload 4 (Invalid Status Value in Timer State)**:
   - Target: `/users/user_123/timer/state`
   - User: `user_123`
   - Data: `{"status": "hacked_status", "mode": "focus", "durationMs": 1500000, "targetEndTimestamp": 0, "remainingMs": 1500000, "completedSessionsCount": 0, "updatedAt": 1700000000000}`
   - Expected: `PERMISSION_DENIED`

5. **Payload 5 (Huge String Denial-of-Wallet in Session Label)**:
   - Target: `/users/user_123/timer/state`
   - User: `user_123`
   - Data: `{"status": "running", "mode": "focus", "durationMs": 1500000, "targetEndTimestamp": 1800000000000, "remainingMs": 0, "completedSessionsCount": 0, "sessionLabel": "A".repeat(5000), "updatedAt": 1700000000000}`
   - Expected: `PERMISSION_DENIED` (`maxLength` violated)

6. **Payload 6 (Session Record UID Impersonation)**:
   - Target: `/users/user_123/sessions/session_abc`
   - User: `user_123`
   - Data: `{"id": "session_abc", "userId": "victim_user_999", "durationMinutes": 25, "completedAt": "2026-11-05T12:00:00Z", "dayKey": "2026-11-05", "mode": "focus"}`
   - Expected: `PERMISSION_DENIED` (userId mismatch with auth.uid)

7. **Payload 7 (Invalid Date Format Injection in Session Record)**:
   - Target: `/users/user_123/sessions/session_abc`
   - User: `user_123`
   - Data: `{"id": "session_abc", "userId": "user_123", "durationMinutes": 25, "completedAt": "2026-11-05T12:00:00Z", "dayKey": "<script>alert(1)</script>", "mode": "focus"}`
   - Expected: `PERMISSION_DENIED` (Regex failure on dayKey)

8. **Payload 8 (Negative Focus Duration in Settings)**:
   - Target: `/users/user_123/settings/config`
   - User: `user_123`
   - Data: `{"focusDurationMinutes": -25, "shortBreakDurationMinutes": 5, "longBreakDurationMinutes": 15, "longBreakInterval": 4, "autoStartBreaks": false, "autoStartFocus": false, "soundEnabled": true, "notificationEnabled": true, "theme": "dark"}`
   - Expected: `PERMISSION_DENIED` (Out of bounds)

9. **Payload 9 (Invalid Theme Option in Settings)**:
   - Target: `/users/user_123/settings/config`
   - User: `user_123`
   - Data: `{"focusDurationMinutes": 25, "shortBreakDurationMinutes": 5, "longBreakDurationMinutes": 15, "longBreakInterval": 4, "autoStartBreaks": false, "autoStartFocus": false, "soundEnabled": true, "notificationEnabled": true, "theme": "neon-glow-hacker"}`
   - Expected: `PERMISSION_DENIED` (Enum validation failure)

10. **Payload 10 (Direct Modification of Catch-All / Root Document)**:
    - Target: `/root_config/hacked`
    - User: `user_123`
    - Data: `{"danger": true}`
    - Expected: `PERMISSION_DENIED` (Default-deny rule)

11. **Payload 11 (Writing to Connection Test Path)**:
    - Target: `/test/connection`
    - User: `user_123`
    - Data: `{"status": "tampered"}`
    - Expected: `PERMISSION_DENIED` (Only read allowed for connection checks)

12. **Payload 12 (Overwriting Completed Session Record with Different Owner)**:
    - Target: `/users/user_123/sessions/session_abc`
    - User: `attacker_456`
    - Operation: `delete` or `update`
    - Expected: `PERMISSION_DENIED` (User is not the path owner)
