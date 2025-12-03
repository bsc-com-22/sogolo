-- Allow admins to update any profile
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to view all profiles (already covered by public select, but good for completeness if we restrict select later)
-- No change needed for select as it's public.
