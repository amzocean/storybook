// Simple in-memory rate limiter (per IP)
// Resets on server restart — good enough for Vercel serverless

const requests = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // 5 story generations per hour per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];

  // Remove entries outside the window
  const recent = timestamps.filter(t => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const oldestInWindow = recent[0];
    const resetIn = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000 / 60); // minutes
    return { allowed: false, remaining: 0, resetIn };
  }

  recent.push(now);
  requests.set(ip, recent);

  return { allowed: true, remaining: MAX_REQUESTS - recent.length, resetIn: 0 };
}
