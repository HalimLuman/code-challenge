import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportSchema, validationError } from '@/lib/validators'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues), { status: 422 })

  if (parsed.data.reported_id === user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({ reporter_id: user.id, ...parsed.data })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
