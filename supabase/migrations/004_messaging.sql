create table if not exists conversations (
  id            uuid primary key default gen_random_uuid(),
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (participant_a, participant_b),
  check (participant_a < participant_b)
);

alter table conversations enable row level security;

create policy "Participants can view their conversations"
  on conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can create conversations with accepted connections"
  on conversations for insert
  with check (
    auth.uid() = participant_a or auth.uid() = participant_b
  );

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  read_at         timestamptz,
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at desc);

alter table messages enable row level security;

create policy "Participants can view messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );
