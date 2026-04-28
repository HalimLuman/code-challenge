import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { writeAuditLog } from '@/lib/audit'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { confirm } = body

  // Confirm the user typed their username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile || confirm !== profile.username) {
    return NextResponse.json({ error: 'Username confirmation does not match' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? null

  await writeAuditLog({
    actor_id: user.id,
    action: 'account.deleted',
    target_id: user.id,
    metadata: { username: profile.username },
    ip_address: ip,
  })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
