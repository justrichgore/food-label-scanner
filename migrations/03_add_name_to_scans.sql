-- Add name column to scans table
alter table scans 
add column if not exists name text;
