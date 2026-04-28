import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default('noreply@interestmatcher.app'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  TERMS_VERSION: z.string().optional().default('2026-04'),
  PRIVACY_VERSION: z.string().optional().default('2026-04'),
  MIN_AGE: z.coerce.number().optional().default(16),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid environment variables: ${missing}`)
  }
  return result.data
}

// Lazily parsed so the build doesn't fail when optional vars are absent
let _env: Env | undefined
export function getEnv(): Env {
  if (!_env) _env = parseEnv()
  return _env
}
