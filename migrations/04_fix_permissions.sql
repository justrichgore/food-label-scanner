-- Ensure scans table has user_id
alter table scans 
add column if not exists user_id uuid references auth.users default auth.uid();

-- Enable RLS
alter table scans enable row level security;

-- Drop existing policies to avoid conflicts or outdated definitions
drop policy if exists "Users can view their own scans" on scans;
drop policy if exists "Users can insert their own scans" on scans;
drop policy if exists "Users can delete their own scans" on scans;

-- Re-create policies
create policy "Users can view their own scans" on scans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own scans" on scans
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own scans" on scans
  for delete using (auth.uid() = user_id);
