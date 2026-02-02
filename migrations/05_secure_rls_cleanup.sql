-- Drop insecure policies that were allowing global access
drop policy if exists "Enable insert access for all users" on scans;
drop policy if exists "Enable read access for all users" on scans;
drop policy if exists "Enable update access for all users" on scans;
drop policy if exists "Enable delete access for all users" on scans;

-- Just to be safe, let's re-ensure the strict policies exist (this is idempotent usually, but let's drop and recreate to be 100% sure of the state)
drop policy if exists "Users can view their own scans" on scans;
drop policy if exists "Users can insert their own scans" on scans;
drop policy if exists "Users can delete their own scans" on scans;
drop policy if exists "Users can update their own scans" on scans;

-- Re-create strict policies
create policy "Users can view their own scans" on scans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own scans" on scans
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own scans" on scans
  for delete using (auth.uid() = user_id);

create policy "Users can update their own scans" on scans
  for update using (auth.uid() = user_id);
