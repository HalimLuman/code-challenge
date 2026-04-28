-- profiles (extends auth.users with display metadata)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  created_at timestamptz default now()
);

-- per-user interests (normalized to lowercase at write time)
create table interests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- anonymous interests submitted via public API
create table anonymous_interests (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  metadata   jsonb default '{}',
  created_at timestamptz default now()
);

-- Row-level security
alter table profiles          enable row level security;
alter table interests         enable row level security;
alter table anonymous_interests enable row level security;

-- Profiles: any authenticated user can read; owner can insert/update
create policy "profiles_select" on profiles
  for select to authenticated using (true);

create policy "profiles_insert" on profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles_update" on profiles
  for update to authenticated using (id = auth.uid());

-- Interests: owner-only read/write (cross-user matching handled by function below)
create policy "interests_select" on interests
  for select to authenticated using (user_id = auth.uid());

create policy "interests_insert" on interests
  for insert to authenticated with check (user_id = auth.uid());

create policy "interests_delete" on interests
  for delete to authenticated using (user_id = auth.uid());

-- Anonymous interests: open insert for the public API endpoint
create policy "anon_interests_insert" on anonymous_interests
  for insert with check (true);

-- Similar-users query: SECURITY DEFINER bypasses RLS so we can read
-- other users' interests without exposing the raw table to clients.
create or replace function get_similar_users(current_user_id uuid)
returns table(
  user_id          uuid,
  username         text,
  shared_interests text[],
  match_count      int
)
language sql
security definer
set search_path = public
as $$
  select
    p.id                                          as user_id,
    p.username,
    array_agg(i2.name order by i2.name)          as shared_interests,
    count(*)::int                                 as match_count
  from   interests i1
  join   interests i2 on i1.name = i2.name
  join   profiles  p  on p.id    = i2.user_id
  where  i1.user_id = current_user_id
    and  i2.user_id != current_user_id
  group  by p.id, p.username
  order  by match_count desc;
$$;
