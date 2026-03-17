-- =====================================================
-- IdeaForge MVP – Scoped Authentication Migration
-- =====================================================

-- 1. Remove the global unique constraint on users.email
-- First, find the name of the constraint. In typical setups it's 'users_email_key'.
-- However, since we're using a migration script, we'll use a safer approach.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 2. Add a new composite unique constraint for (email, tenant_id)
-- This allows same email across different tenants, but unique within one tenant.
ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);

-- 3. Ensure all existing users have a tenant_id (already handled by previous migration, but good to double check)
UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- 4. Make tenant_id NOT NULL for all users once migration is stable
-- ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
