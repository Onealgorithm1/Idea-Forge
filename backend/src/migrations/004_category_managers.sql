-- Migration 004: Category Managers
-- Add a manager_id to the categories table to support assigning category owners.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for querying categories by manager efficiently
CREATE INDEX IF NOT EXISTS idx_categories_manager_id ON categories(manager_id);
