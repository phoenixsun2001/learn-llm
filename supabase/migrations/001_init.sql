-- Learn-LLM Database Schema
-- Phase 4: User System + Tutorial Orchestration
-- Run in Supabase SQL Editor or via `supabase db push`

-- ============================================================
-- 1. User Progress (cloud sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutorial_slug TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    chapter_index INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tutorial_slug)
);

-- Index for fast user progress lookup
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- ============================================================
-- 2. Admin Tutorials (tutorial orchestration)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_tutorials (
    id TEXT PRIMARY KEY,                  -- tut-2026-001
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,               -- principle/model/harness/workflow/development/practice
    subcategory TEXT,
    difficulty TEXT NOT NULL,             -- beginner/intermediate/advanced
    chapters JSONB DEFAULT '[]'::jsonb,   -- [{title, content, material_refs}]
    prerequisites JSONB DEFAULT '[]'::jsonb,
    estimated_time INTEGER,               -- minutes
    status TEXT DEFAULT 'draft',          -- draft/published/archived
    version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_tutorials_status ON admin_tutorials(status);
CREATE INDEX IF NOT EXISTS idx_admin_tutorials_category ON admin_tutorials(category);

-- ============================================================
-- 3. Admin Pathways (learning path orchestration)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_pathways (
    id TEXT PRIMARY KEY,                  -- pwy-2026-001
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL,                  -- beginner/intermediate/advanced/expert
    steps JSONB DEFAULT '[]'::jsonb,      -- [{tutorial_id, order, required}]
    icon TEXT,
    status TEXT DEFAULT 'draft',          -- draft/published/archived
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Admin Scenarios
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_scenarios (
    id TEXT PRIMARY KEY,                  -- scn-2026-001
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal TEXT NOT NULL,
    tools JSONB DEFAULT '[]'::jsonb,       -- [{tool_id, name}]
    tutorials JSONB DEFAULT '[]'::jsonb,   -- [tutorial_id, ...]
    workflow TEXT,                         -- Mermaid or text workflow
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_scenarios ENABLE ROW LEVEL SECURITY;

-- User progress: users can only read/write their own progress
CREATE POLICY "Users manage own progress"
    ON user_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin tables: only admins can modify
CREATE POLICY "Admins manage tutorials"
    ON admin_tutorials
    FOR ALL
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins manage pathways"
    ON admin_pathways
    FOR ALL
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admins manage scenarios"
    ON admin_scenarios
    FOR ALL
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Public read access for published tutorials, pathways, scenarios
CREATE POLICY "Public read published tutorials"
    ON admin_tutorials
    FOR SELECT
    USING (status = 'published');

CREATE POLICY "Public read published pathways"
    ON admin_pathways
    FOR SELECT
    USING (status = 'published');

CREATE POLICY "Public read published scenarios"
    ON admin_scenarios
    FOR SELECT
    USING (status = 'published');
