import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ suggestions: [] })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('interest_taxonomy')
    .select('name, category')
    .ilike('name', `%${q}%`)
    .limit(8)

  if (error) return NextResponse.json({ suggestions: [] })
  return NextResponse.json({ suggestions: data })
}
