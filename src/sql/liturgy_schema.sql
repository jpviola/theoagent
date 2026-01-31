
-- Table for storing Liturgy of the Hours data
create table if not exists liturgy_hours (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  hour_type text not null, -- 'oficio', 'laudes', 'tercia', 'sexta', 'nona', 'visperas', 'completas'
  title text,
  content_html text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to ensure we don't have duplicate entries for the same hour/date
  unique(date, hour_type)
);

-- Index for faster querying by date
create index if not exists idx_liturgy_hours_date on liturgy_hours(date);

-- Enable Row Level Security (RLS)
alter table liturgy_hours enable row level security;

-- Policy: Allow read access to everyone
create policy "Public can view liturgy hours"
  on liturgy_hours for select
  using (true);

-- Policy: Allow service role (scripts) to insert/update
-- Note: Service role bypasses RLS, but it's good practice to have policies.
-- Ideally only authenticated admins or service role can write.
create policy "Service role can insert/update liturgy hours"
  on liturgy_hours for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
