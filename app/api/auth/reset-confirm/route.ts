import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resetConfirmSchema, validationError } from '@/lib/validators'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = resetConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error.issues), { status: 422 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
