alter table profiles
  add column if not exists push_token text;

-- Allow users to update their own push_token
create policy "profiles_update_push_token" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
