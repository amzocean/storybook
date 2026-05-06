// Simple in-memory rate limiter (per IP + global daily cap)
// Resets on server restart — good enough for Vercel serverless

const requests = new Map<string, number[]>();
const globalRequests: number[] = [];

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_IP = 3; // 3 stories/hour per IP
const DAILY_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_GLOBAL = 20; // 20 stories/day total across all users

export function checkRateLimit(ip: string): { allowed: boolean; message: string } {
  const now = Date.now();

  // Global daily cap
  const recentGlobal = globalRequests.filter(t => now - t < DAILY_MS);
  globalRequests.length = 0;
  globalRequests.push(...recentGlobal);

  if (recentGlobal.length >= MAX_DAILY_GLOBAL) {
    return { allowed: false, message: "Story World is resting for today! 🌙 Come back tomorrow with more ideas!" };
  }

  // Per-IP hourly limit
  const timestamps = requests.get(ip) || [];
  const recent = timestamps.filter(t => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_IP) {
    const resetIn = Math.ceil((recent[0] + WINDOW_MS - now) / 1000 / 60);
    return { allowed: false, message: `Whoa, slow down! 🐢 You can create more stories in about ${resetIn} minutes.` };
  }

  recent.push(now);
  requests.set(ip, recent);
  globalRequests.push(now);

  return { allowed: true, message: '' };
}
