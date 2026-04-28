import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for') ?? null
  const termsVersion = process.env.TERMS_VERSION ?? '2026-04'
  const privacyVersion = process.env.PRIVACY_VERSION ?? '2026-04'

  const { error } = await supabase.from('consent_records').insert({
    user_id: user.id,
    terms_version: termsVersion,
    privacy_version: privacyVersion,
    ip_address: ip,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
