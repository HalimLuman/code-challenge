create table if not exists connection_requests (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (sender_id, recipient_id)
);

alter table connection_requests enable row level security;

create policy "Users can view their own connection requests"
  on connection_requests for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send connection requests"
  on connection_requests for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can update connection status"
  on connection_requests for update
  using (auth.uid() = recipient_id);

create policy "Users can delete their connections"
  on connection_requests for delete
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
