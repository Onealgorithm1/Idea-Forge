-- Migration 003: Enhancements
-- 1. Add is_default column to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Create user_idea_spaces table for allocation
CREATE TABLE IF NOT EXISTS user_idea_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idea_space_id UUID NOT NULL REFERENCES idea_spaces(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, idea_space_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_idea_spaces_user_id ON user_idea_spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_idea_spaces_tenant_id ON user_idea_spaces(tenant_id);

-- 3. Update existing votes table to ensure it has vote_value if not present
-- (It was mentioned in 001_multi_tenant_schema.sql but let's be sure)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='votes' AND column_name='vote_value') THEN
        ALTER TABLE votes ADD COLUMN vote_value NUMERIC(10,2) DEFAULT 1;
    END IF;
END $$;
