// Editorial hold during native screen recording, not a UI readiness check.
// Keep it bounded; each clip needs readable footage before and after a gesture.
var holdMs = Math.max(0, Math.min(8000, Number(HOLD_MS)));
var holdUntil = Date.now() + holdMs;
while (Date.now() < holdUntil) { /* Maestro has no fixed-delay command. */ }
