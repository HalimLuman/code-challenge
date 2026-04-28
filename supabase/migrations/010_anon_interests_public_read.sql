-- Allow anyone (anon or authenticated) to read anonymous_interests
-- so the public homepage can display the recent submission feed.
create policy "anon_interests_select" on anonymous_interests
  for select using (true);
