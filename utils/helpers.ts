/**
 * Utility helpers for CrashGuard
 */

/**
 * Format a timestamp (ms or ISO string) to a human-readable date/time string.
 */
export function formatDateTime(ts: number | string): string {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a timestamp to time-only string.
 */
export function formatTime(ts: number | string): string {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a human-readable "time ago" label.
 */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to N decimal places.
 */
export function round(value: number, decimals: number = 2): number {
  return parseFloat(value.toFixed(decimals));
}

/**
 * Returns GSM signal label from numeric level (0–4).
 */
export function gsmLabel(signal: number): string {
  const labels = ['No Signal', 'Poor', 'Fair', 'Good', 'Excellent'];
  return labels[clamp(signal, 0, 4)] ?? 'Unknown';
}

/**
 * Returns battery icon name based on percentage.
 */
export function batteryIcon(pct: number): string {
  if (pct > 60) return 'battery-full';
  if (pct > 20) return 'battery-half';
  return 'battery-dead';
}

/**
 * Validates a phone number (basic check for E.164 format).
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
}
