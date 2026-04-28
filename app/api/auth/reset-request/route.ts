import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimits } from '@/lib/ratelimit'
import { resetRequestSchema, validationError } from '@/lib/validators'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed, retryAfter } = rateLimits.resetRequest(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const parsed = resetRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error.issues), { status: 422 })
  }

  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : ''}/reset-password`

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${request.nextUrl.origin}/auth/callback?next=/reset-password`,
  })

  // Always return success to avoid email enumeration
  return NextResponse.json({ success: true })
}
