-- ==============================================================
-- CONNECTOR Welfare Schemes Database Schema for Supabase
-- ==============================================================
-- Copy & Run this SQL script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste & Run
-- ==============================================================

-- 1. Schemes Catalog Table
CREATE TABLE IF NOT EXISTS public.schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hindi_name TEXT,
    category TEXT NOT NULL,
    ministry TEXT,
    sponsor TEXT DEFAULT 'Central Sector',
    tagline TEXT,
    brief TEXT,
    financial_benefit TEXT,
    benefits JSONB DEFAULT '[]'::jsonb,
    eligibility_criteria JSONB DEFAULT '{}'::jsonb,
    documents_required JSONB DEFAULT '[]'::jsonb,
    application_steps JSONB DEFAULT '[]'::jsonb,
    official_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_schemes_category ON public.schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_sponsor ON public.schemes(sponsor);
CREATE INDEX IF NOT EXISTS idx_schemes_popular ON public.schemes(is_popular);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the verified schemes catalog
DROP POLICY IF EXISTS "Public can view schemes" ON public.schemes;
CREATE POLICY "Public can view schemes" 
    ON public.schemes 
    FOR SELECT 
    USING (true);

-- Allow service_role key (server backend) or authenticated admins to insert/update/delete
DROP POLICY IF EXISTS "Service role full access" ON public.schemes;
CREATE POLICY "Service role full access" 
    ON public.schemes 
    FOR ALL 
    USING (true)
    WITH CHECK (true);
