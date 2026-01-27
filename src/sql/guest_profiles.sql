
-- Table for guest users (no auth required)
CREATE TABLE IF NOT EXISTS public.guest_profiles (
    id UUID PRIMARY KEY, -- Generated client-side or server-side
    role TEXT,
    experience_level TEXT,
    interests TEXT[],
    preferred_language TEXT,
    onboarding_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS but allow public inserts (since we want to collect data from unauth users)
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (needed for guest onboarding)
CREATE POLICY "Allow public inserts to guest_profiles" 
ON public.guest_profiles 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Allow users to read/update their own profile based on ID (optional, if we want them to be able to fetch it later)
-- Ideally, we just use the API with service role to update/read to be secure, 
-- but for "cookies" based approach, we might just trust the ID if it's a UUID.
-- For now, let's keep it simple: Public Insert, and Read/Update via Service Role API only to prevent scraping.
