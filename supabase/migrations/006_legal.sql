create table if not exists consent_records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  terms_version    text not null,
  privacy_version  text not null,
  accepted_at      timestamptz default now(),
  ip_address       inet
);

alter table consent_records enable row level security;

create policy "Users can view their own consent records"
  on consent_records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own consent records"
  on consent_records for insert
  with check (auth.uid() = user_id);
