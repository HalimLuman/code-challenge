-- Fix matching logic to respect privacy settings
-- 1. Users with 'private' visibility should not appear in any match results.
-- 2. Users with 'connections' visibility should only appear if they are already connected.

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
    and  (
      p.visibility = 'public' 
      or (p.visibility = 'connections' and exists (
        select 1 from connection_requests cr 
        where cr.status = 'accepted' 
        and (
          (cr.sender_id = current_user_id and cr.recipient_id = p.id) 
          or (cr.sender_id = p.id and cr.recipient_id = current_user_id)
        )
      ))
    )
  group  by p.id, p.username
  order  by match_count desc;
$$;
