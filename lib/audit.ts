import { createClient as createAdminClient } from '@supabase/supabase-js'

const admin = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

interface AuditEntry {
  actor_id?: string | null
  action: string
  target_id?: string | null
  metadata?: Record<string, unknown>
  ip_address?: string | null
}

export async function writeAuditLog(entry: AuditEntry) {
  await admin().from('audit_logs').insert({
    actor_id: entry.actor_id ?? null,
    action: entry.action,
    target_id: entry.target_id ?? null,
    metadata: entry.metadata ?? {},
    ip_address: entry.ip_address ?? null,
  })
}
