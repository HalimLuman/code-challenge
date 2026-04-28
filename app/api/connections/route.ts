import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { connectionRequestSchema, connectionUpdateSchema, validationError } from '@/lib/validators'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('connection_requests')
    .select('id, sender_id, status, created_at, profiles!sender_id(username, avatar_url)')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = connectionRequestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues), { status: 422 })

  if (parsed.data.recipient_id === user.id) {
    return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .insert({ sender_id: user.id, recipient_id: parsed.data.recipient_id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = connectionUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues), { status: 422 })

  // Fetch connection details first so we have both IDs for conversation creation
  const { data: connReq } = await supabase
    .from('connection_requests')
    .select('sender_id, recipient_id')
    .eq('id', id)
    .eq('recipient_id', user.id)
    .single()

  const { error } = await supabase
    .from('connection_requests')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create a conversation row when a connection is accepted so it shows in /messages
  if (parsed.data.status === 'accepted' && connReq) {
    const participantA = connReq.sender_id < connReq.recipient_id ? connReq.sender_id : connReq.recipient_id
    const participantB = connReq.sender_id < connReq.recipient_id ? connReq.recipient_id : connReq.sender_id

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_a', participantA)
      .eq('participant_b', participantB)
      .single()

    if (!existing) {
      await supabase
        .from('conversations')
        .insert({ participant_a: participantA, participant_b: participantB })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the user is either sender or recipient before deleting
  const { data: conn } = await admin
    .from('connection_requests')
    .select('sender_id, recipient_id')
    .eq('id', id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  if (conn.sender_id !== user.id && conn.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('connection_requests')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
