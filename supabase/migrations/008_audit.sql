create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles(id) on delete set null,
  action     text not null,
  target_id  uuid,
  metadata   jsonb default '{}',
  ip_address inet,
  created_at timestamptz default now()
);

-- No RLS — only accessible via service-role key
