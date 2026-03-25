import { Request, Response } from 'express';
import { query } from '../config/db.js';

// =====================================================
// Tenant Management (Super Admin only)
// =====================================================

export const listTenants = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT i.id) as idea_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN ideas i ON i.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('List tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTenant = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [tenant, users, ideas] = await Promise.all([
      query('SELECT * FROM tenants WHERE id = $1', [id]),
      query('SELECT id, name, email, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT id, title, status, votes_count, created_at FROM ideas WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20', [id]),
    ]);
    if (tenant.rows.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ ...tenant.rows[0], users: users.rows, recent_ideas: ideas.rows });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTenantBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const result = await query(`
      SELECT t.id, t.name, t.slug, t.status, d.logo_url, d.theme_color, d.description
      FROM tenants t
      LEFT JOIN tenant_details d ON t.id = d.tenant_id
      WHERE t.slug = $1
    `, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get tenant by slug error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  const { name, slug, plan_type = 'free' } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'Name and slug are required' });

  try {
    const existing = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Slug already taken' });

    const result = await query(
      `INSERT INTO tenants (name, slug, status, plan_type) VALUES ($1, $2, 'active', $3) RETURNING *`,
      [name, slug, plan_type]
    );

    // Create default roles for the new tenant
    await query(
      `INSERT INTO roles (tenant_id, name, description, is_system_role) VALUES 
        ($1, 'admin', 'Full administrative access', TRUE),
        ($1, 'member', 'Regular member access', TRUE)`,
      [result.rows[0].id]
    );

    // Create default idea space
    await query(
      `INSERT INTO idea_spaces (tenant_id, name, key, description) VALUES ($1, 'General', 'general', 'Default idea space')`,
      [result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, status, plan_type, settings_json } = req.body;

  try {
    const result = await query(
      `UPDATE tenants SET 
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        plan_type = COALESCE($3, plan_type),
        settings_json = COALESCE($4, settings_json),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, status, plan_type, settings_json, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === '00000000-0000-0000-0000-000000000001') {
    return res.status(403).json({ message: 'Cannot delete the default tenant' });
  }
  try {
    await query('UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2', ['deleted', id]);
    res.json({ message: 'Tenant deleted' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTenantStats = async (_req: Request, res: Response) => {
  try {
    const [tenantStats, ideaStats] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
          COUNT(*) as total_tenants,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
        FROM tenants
      `),
      query(`
        SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM ideas) as total_ideas,
          (SELECT COUNT(*) FROM comments) as total_comments,
          (SELECT COUNT(*) FROM votes WHERE type = 'up') as total_votes
      `)
    ]);
    res.json({ ...tenantStats.rows[0], ...ideaStats.rows[0] });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
