// In-memory sliding-window rate limiter.
// For production, replace with Upstash Redis by providing UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN env vars.

type WindowEntry = { count: number; resetAt: number }
const store = new Map<string, WindowEntry>()

function check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

export const rateLimits = {
  publicInterests: (ip: string) => check(`interests:${ip}`, 20, 5 * 60 * 1000),
  resetRequest: (ip: string) => check(`reset:${ip}`, 3, 60 * 60 * 1000),
  resendVerification: (ip: string) => check(`resend:${ip}`, 3, 60 * 60 * 1000),
  messaging: (ip: string) => check(`msg:${ip}`, 60, 60 * 1000),
}
