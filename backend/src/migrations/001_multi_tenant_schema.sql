-- =====================================================
-- IdeaForge MVP – Multi-Tenant Schema Migration
-- Run this on your Neon PostgreSQL database
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Phase 1: Tenant & User Identity
-- =====================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  plan_type VARCHAR(50) DEFAULT 'free',
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert a default tenant for existing data migration
INSERT INTO tenants (id, name, slug, status, plan_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'active', 'pro')
ON CONFLICT DO NOTHING;

-- Add tenant_id to existing users table and extend it
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Migrate existing users to default tenant
UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(150),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- Migrate existing users into tenant_users for default tenant
INSERT INTO tenant_users (tenant_id, user_id, joined_at)
SELECT '00000000-0000-0000-0000-000000000001', id, created_at
FROM users
ON CONFLICT (tenant_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- Insert default roles for default tenant
INSERT INTO roles (tenant_id, name, description, is_system_role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Full administrative access', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'member', 'Regular member access', TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tenant_user_id UUID NOT NULL REFERENCES tenant_users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_user_id, role_id)
);

-- =====================================================
-- Phase 2: Ideas, Tags, Comments, Attachments
-- =====================================================

CREATE TABLE IF NOT EXISTS idea_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);

-- Insert a default idea space for existing ideas
INSERT INTO idea_spaces (id, tenant_id, name, key, description)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'General', 'general', 'General idea space for all submissions')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS idea_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  idea_space_id UUID REFERENCES idea_spaces(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add tenant_id to existing ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS idea_space_id UUID REFERENCES idea_spaces(id);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS priority VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS current_score NUMERIC(10,2);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Migrate existing ideas to default tenant and space
UPDATE ideas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE ideas SET idea_space_id = '00000000-0000-0000-0000-000000000002' WHERE idea_space_id IS NULL;

CREATE TABLE IF NOT EXISTS idea_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS idea_tag_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  idea_id UUID NOT NULL REFERENCES ideas(id),
  tag_id UUID NOT NULL REFERENCES idea_tags(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idea_id, tag_id)
);

-- Add tenant_id to existing comments table  
ALTER TABLE comments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
UPDATE comments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS idea_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  idea_id UUID NOT NULL REFERENCES ideas(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes BIGINT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Phase 3: Votes, Scorecards, Scoring
-- =====================================================

-- Add tenant_id to existing votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_value NUMERIC(10,2) DEFAULT 1;
UPDATE votes SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scorecard_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES scorecards(id),
  name VARCHAR(255) NOT NULL,
  weight NUMERIC(8,2) NOT NULL DEFAULT 1.0,
  min_score NUMERIC(10,2) DEFAULT 0,
  max_score NUMERIC(10,2) DEFAULT 10,
  display_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  idea_id UUID NOT NULL REFERENCES ideas(id),
  scorecard_id UUID NOT NULL REFERENCES scorecards(id),
  criterion_id UUID NOT NULL REFERENCES scorecard_criteria(id),
  scored_by UUID NOT NULL REFERENCES users(id),
  score NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idea_id, criterion_id, scored_by)
);

-- =====================================================
-- Phase 4: Workflows, Notifications, Audit Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL DEFAULT 'idea',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100) NOT NULL,
  is_initial BOOLEAN DEFAULT FALSE,
  is_terminal BOOLEAN DEFAULT FALSE,
  display_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_id, code)
);

-- Add tenant_id to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in_app';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
UPDATE notifications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  actor_user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  action VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ideas_tenant_space_status ON ideas(tenant_id, idea_space_id, status);
CREATE INDEX IF NOT EXISTS idx_ideas_submitter ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_scores_idea_id ON idea_scores(idea_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
