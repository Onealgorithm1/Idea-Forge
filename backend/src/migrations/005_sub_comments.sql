-- Add parent_id to comments for nesting
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Add index for faster lookup of replies
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
