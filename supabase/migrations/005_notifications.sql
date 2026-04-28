create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null
             check (type in ('connection_request', 'connection_accepted', 'new_message')),
  payload    jsonb default '{}',
  read_at    timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_unread_idx on notifications (user_id, read_at) where read_at is null;

alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Trigger: create notification on new connection request
create or replace function notify_connection_request()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications (user_id, type, payload)
  values (
    new.recipient_id,
    'connection_request',
    jsonb_build_object('sender_id', new.sender_id, 'request_id', new.id)
  );
  return new;
end;
$$;

create trigger on_connection_request_insert
  after insert on connection_requests
  for each row execute function notify_connection_request();

-- Trigger: create notification on accepted connection
create or replace function notify_connection_accepted()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into notifications (user_id, type, payload)
    values (
      new.sender_id,
      'connection_accepted',
      jsonb_build_object('acceptor_id', new.recipient_id, 'request_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger on_connection_accepted
  after update on connection_requests
  for each row execute function notify_connection_accepted();

-- Trigger: create notification on new message
create or replace function notify_new_message()
returns trigger language plpgsql security definer as $$
declare
  other_participant uuid;
begin
  select case
    when c.participant_a = new.sender_id then c.participant_b
    else c.participant_a
  end into other_participant
  from conversations c where c.id = new.conversation_id;

  insert into notifications (user_id, type, payload)
  values (
    other_participant,
    'new_message',
    jsonb_build_object('sender_id', new.sender_id, 'conversation_id', new.conversation_id)
  );
  return new;
end;
$$;

create trigger on_message_insert
  after insert on messages
  for each row execute function notify_new_message();
