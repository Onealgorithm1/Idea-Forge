import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_y0KepXrE4sMF@ep-icy-night-adzbcu6r-pooler.c-2.us-east-1.aws.neon.tech/Ideaforge?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Run each statement with individual error handling
async function runStatement(client: any, sql: string, label: string) {
  try {
    await client.query(sql);
    console.log(`  ✅ ${label}`);
    return true;
  } catch (err: any) {
    if (['42701', '42P07', '42P16', '23505', '42710'].includes(err.code)) {
      console.log(`  ⚠️  Already exists — ${label}`);
      return true;
    }
    console.error(`  ❌ FAILED — ${label}: ${err.message}`);
    return false;
  }
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('\n🚀 IdeaForge Multi-Tenant Database Migration\n');

    // === EXTENSIONS ===
    await runStatement(client, `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`, 'Extension: pgcrypto');

    // === TENANTS ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        plan_type VARCHAR(50) DEFAULT 'free',
        settings_json JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, 'Table: tenants');

    await runStatement(client, `
      INSERT INTO tenants (id, name, slug, status, plan_type)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'active', 'pro')
      ON CONFLICT DO NOTHING
    `, 'Seed: default tenant');

    // === USERS — add new columns ===
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: users.tenant_id');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(200)`, 'Column: users.display_name');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`, 'Column: users.first_name');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`, 'Column: users.last_name');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`, 'Column: users.status');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`, 'Column: users.last_login_at');
    await runStatement(client, `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE`, 'Column: users.is_super_admin');
    await runStatement(client, `UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: users → default tenant');

    // === TENANT_USERS ===
    await runStatement(client, `
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
      )
    `, 'Table: tenant_users');

    await runStatement(client, `
      INSERT INTO tenant_users (tenant_id, user_id, joined_at)
      SELECT '00000000-0000-0000-0000-000000000001', id, created_at FROM users
      ON CONFLICT (tenant_id, user_id) DO NOTHING
    `, 'Migrate: users → tenant_users');

    // === ROLES ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system_role BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, name)
      )
    `, 'Table: roles');

    await runStatement(client, `
      INSERT INTO roles (tenant_id, name, description, is_system_role) VALUES 
        ('00000000-0000-0000-0000-000000000001', 'admin', 'Full administrative access', TRUE),
        ('00000000-0000-0000-0000-000000000001', 'member', 'Regular member access', TRUE)
      ON CONFLICT DO NOTHING
    `, 'Seed: default roles');

    // === USER_ROLES ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        tenant_user_id UUID NOT NULL REFERENCES tenant_users(id),
        role_id UUID NOT NULL REFERENCES roles(id),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_user_id, role_id)
      )
    `, 'Table: user_roles');

    // === IDEA SPACES ===
    await runStatement(client, `
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
      )
    `, 'Table: idea_spaces');

    await runStatement(client, `
      INSERT INTO idea_spaces (id, tenant_id, name, key, description)
      VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'General', 'general', 'Default idea space')
      ON CONFLICT DO NOTHING
    `, 'Seed: default idea space');

    // === IDEA CATEGORIES ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS idea_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        idea_space_id UUID REFERENCES idea_spaces(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, 'Table: idea_categories');

    // Also support legacy 'categories' table if it exists
    await runStatement(client, `ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: categories.tenant_id');
    await runStatement(client, `UPDATE categories SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: categories → default tenant');

    // === IDEAS — extend ===
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: ideas.tenant_id');
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS idea_space_id UUID REFERENCES idea_spaces(id)`, 'Column: ideas.idea_space_id');
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS priority VARCHAR(50)`, 'Column: ideas.priority');
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source VARCHAR(100)`, 'Column: ideas.source');
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS current_score NUMERIC(10,2)`, 'Column: ideas.current_score');
    await runStatement(client, `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id)`, 'Column: ideas.owner_id');
    await runStatement(client, `UPDATE ideas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: ideas → default tenant');
    await runStatement(client, `UPDATE ideas SET idea_space_id = '00000000-0000-0000-0000-000000000002' WHERE idea_space_id IS NULL`, 'Migrate: ideas → default space');

    // === IDEA TAGS ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS idea_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, name)
      )
    `, 'Table: idea_tags');

    // Also support legacy 'tags' table if it exists
    await runStatement(client, `ALTER TABLE tags ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: tags.tenant_id');
    await runStatement(client, `UPDATE tags SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: tags → default tenant');

    await runStatement(client, `ALTER TABLE idea_tags ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: idea_tags.tenant_id');
    await runStatement(client, `UPDATE idea_tags SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: idea_tags → default tenant');

    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS idea_tag_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        idea_id UUID NOT NULL REFERENCES ideas(id),
        tag_id UUID NOT NULL REFERENCES idea_tags(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (idea_id, tag_id)
      )
    `, 'Table: idea_tag_links');

    // === BOOKMARKS ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        user_id UUID NOT NULL REFERENCES users(id),
        idea_id UUID NOT NULL REFERENCES ideas(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, idea_id)
      )
    `, 'Table: bookmarks');
    
    await runStatement(client, `ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: bookmarks.tenant_id');
    await runStatement(client, `UPDATE bookmarks SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: bookmarks → default tenant');

    // === COMMENTS — extend ===
    await runStatement(client, `ALTER TABLE comments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: comments.tenant_id');
    await runStatement(client, `ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`, 'Column: comments.is_edited');
    await runStatement(client, `UPDATE comments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: comments → default tenant');

    // === IDEA ATTACHMENTS ===
    await runStatement(client, `
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
      )
    `, 'Table: idea_attachments');

    // === VOTES — extend ===
    await runStatement(client, `ALTER TABLE votes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: votes.tenant_id');
    await runStatement(client, `ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_value NUMERIC(10,2) DEFAULT 1`, 'Column: votes.vote_value');
    await runStatement(client, `UPDATE votes SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: votes → default tenant');

    // === SCORECARDS ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS scorecards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, 'Table: scorecards');

    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS scorecard_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scorecard_id UUID NOT NULL REFERENCES scorecards(id),
        name VARCHAR(255) NOT NULL,
        weight NUMERIC(8,2) NOT NULL DEFAULT 1.0,
        min_score NUMERIC(10,2) DEFAULT 0,
        max_score NUMERIC(10,2) DEFAULT 10,
        display_order INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, 'Table: scorecard_criteria');

    await runStatement(client, `
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
      )
    `, 'Table: idea_scores');

    // === WORKFLOWS ===
    await runStatement(client, `
      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100) NOT NULL DEFAULT 'idea',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, 'Table: workflows');

    await runStatement(client, `
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
      )
    `, 'Table: workflow_states');

    // === NOTIFICATIONS — extend ===
    await runStatement(client, `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`, 'Column: notifications.tenant_id');
    await runStatement(client, `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_type VARCHAR(100)`, 'Column: notifications.event_type');
    await runStatement(client, `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in_app'`, 'Column: notifications.channel');
    await runStatement(client, `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ`, 'Column: notifications.sent_at');
    await runStatement(client, `UPDATE notifications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL`, 'Migrate: notifications → default tenant');

    // === AUDIT LOGS ===
    await runStatement(client, `
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
      )
    `, 'Table: audit_logs');

    // === INDEXES ===
    await runStatement(client, `CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id)`, 'Index: tenant_users.tenant_id');
    await runStatement(client, `CREATE INDEX IF NOT EXISTS idx_ideas_tenant ON ideas(tenant_id)`, 'Index: ideas.tenant_id');
    await runStatement(client, `CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`, 'Index: users.tenant_id');
    await runStatement(client, `CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, entity_type)`, 'Index: audit_logs');

    console.log('\n✅ Migration complete!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('\n❌ Migration aborted:', err.message);
  process.exit(1);
});
