import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createConversationSchema = z.object({
  other_user_id: z.string().uuid(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      participant_a, participant_b,
      profiles!conversations_participant_a_fkey(username, avatar_url),
      messages(body, created_at, sender_id)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversations: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = createConversationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const otherId = parsed.data.other_user_id
  if (otherId === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })

  // Verify accepted connection exists
  const { data: connection } = await supabase
    .from('connection_requests')
    .select('id')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
    )
    .eq('status', 'accepted')
    .single()

  if (!connection) {
    return NextResponse.json({ error: 'Must be connected to start a conversation' }, { status: 403 })
  }

  const participantA = user.id < otherId ? user.id : otherId
  const participantB = user.id < otherId ? otherId : user.id

  // Try to find an existing conversation first (upsert can return null on conflict)
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .single()

  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 })
  }

  // No existing conversation — create one
  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_a: participantA, participant_b: participantB })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
