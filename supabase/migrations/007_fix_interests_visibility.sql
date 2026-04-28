-- Fix interest visibility RLS policies
-- 1. Drop the restrictive owner-only policy
drop policy if exists "interests_select" on interests;

-- 2. Create a permissive policy that respects profile visibility
create policy "interests_select_permissive" on interests
  for select to authenticated
  using (
    user_id = auth.uid() -- Always allow viewing own
    or exists (
      select 1 from profiles p
      where p.id = interests.user_id
      and (
        p.visibility = 'public'
        or (p.visibility = 'connections' and exists (
          select 1 from connection_requests cr
          where cr.status = 'accepted'
          and (
            (cr.sender_id = auth.uid() and cr.recipient_id = p.id)
            or (cr.sender_id = p.id and cr.recipient_id = auth.uid())
          )
        ))
      )
    )
  );
