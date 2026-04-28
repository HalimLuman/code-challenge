import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: profile },
    { data: interests },
    { data: messages },
    { data: consent },
    { data: connections },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('interests').select('*').eq('user_id', user.id),
    supabase.from('messages').select('*').eq('sender_id', user.id),
    supabase.from('consent_records').select('*').eq('user_id', user.id),
    supabase.from('connection_requests').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile,
    interests,
    messages,
    consent_records: consent,
    connections,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="my-data.json"',
    },
  })
}
