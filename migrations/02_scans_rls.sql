-- Add user_id to scans table if it doesn't exist
alter table scans 
add column if not exists user_id uuid references auth.users default auth.uid();

-- Enable RLS
alter table scans enable row level security;

-- Policies
create policy "Users can view their own scans" on scans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own scans" on scans
  for insert with check (auth.uid() = user_id);

-- Optional: Allow users to delete their own scans
create policy "Users can delete their own scans" on scans
  for delete using (auth.uid() = user_id);
