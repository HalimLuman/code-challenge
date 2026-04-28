import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimits } from '@/lib/ratelimit'
import { messageSchema, validationError } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '0')
  const limit = 50

  const { data, error } = await supabase
    .from('messages')
    .select('id, body, sender_id, read_at, created_at, profiles!messages_sender_id_fkey(username)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', params.id)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ messages: data?.reverse() ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed, retryAfter } = rateLimits.messaging(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many messages' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues), { status: 422 })

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: params.id, sender_id: user.id, body: parsed.data.body })
    .select('id, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
