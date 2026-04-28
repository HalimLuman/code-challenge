create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocks enable row level security;

create policy "Users can manage their own blocks"
  on blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason      text not null
              check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  detail      text check (char_length(detail) <= 500),
  status      text not null default 'open'
              check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz default now()
);

alter table reports enable row level security;

create policy "Users can create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
  on reports for select
  using (auth.uid() = reporter_id);
