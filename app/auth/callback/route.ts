import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile for OAuth users who don't have one yet
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const username =
          data.user.user_metadata?.user_name ??
          data.user.user_metadata?.name?.replace(/\s+/g, '_').toLowerCase() ??
          `user_${data.user.id.slice(0, 8)}`

        const avatarUrl =
          data.user.user_metadata?.avatar_url ?? null

        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          avatar_url: avatarUrl,
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
