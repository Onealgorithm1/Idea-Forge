import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { sendEmail } from '../config/mail.js';
import { env } from '../config/env.js';
import { generateViewUrl } from './uploadController.js';

export const createUser = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const actorRole = (req as any).user.role;
    let targetRole = 'user'; // Default

    // If an admin is creating, force role to 'user'
    if (actorRole === 'admin') {
      targetRole = 'user';
    }

    // 1. Check license limit and organization details
    const tenant = await query('SELECT name, slug, max_users FROM tenants WHERE id = $1', [tenantId]);
    if (tenant.rows.length === 0) return res.status(404).json({ message: 'Organization not found' });
    
    const orgName = tenant.rows[0].name || 'your organization';
    const orgSlug = tenant.rows[0].slug || 'default';

    const currentUsers = await query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const maxUsers = tenant.rows[0].max_users || 5;

    if (parseInt(currentUsers.rows[0].count) >= maxUsers) {
      return res.status(403).json({ message: `License limit reached (${maxUsers} users). Please contact support to upgrade.` });
    }

    // 2. Check if user already exists in this tenant
    const existing = await query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'User with this email already exists in this organization' });

    // 3. Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, role, tenant_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id, name, email, role, tenant_id`,
      [name, email, hashedPassword, targetRole, tenantId]
    );

    // 4. Send Response Immediately
    res.status(201).json({
      message: 'User created successfully and invitation sent',
      user: newUser.rows[0]
    });

    // 5. Send Email in Background
    const primaryFrontendUrl = env.FRONTEND_URL ? env.FRONTEND_URL.replace(/['"]/g, '').split(',')[0].trim().replace(/\/$/, '') : 'http://localhost:5173';
    const loginUrl = `${primaryFrontendUrl}/${orgSlug}/login`;
    const emailSubject = `Welcome to ${orgName} on IdeaForge`;
    const emailText = `Hello ${name},\n\nYou have been added to ${orgName} on the IdeaForge platform.\n\nOrganization: ${orgName}\nLogin URL: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.`;
    
    try {
      console.log(`[Background] Sending welcome email to ${email} for tenant ${orgSlug}...`);
      await sendEmail(email, emailSubject, emailText);
    } catch (err) {
      console.error('[Background] Email sending failed in createUser:', err);
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req: any, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.created_at,
              COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]') as assigned_spaces
       FROM users u
       LEFT JOIN user_idea_spaces uis ON u.id = uis.user_id
       LEFT JOIN idea_spaces s ON uis.idea_space_id = s.id
       WHERE u.tenant_id = $1 AND u.role != $2
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [req.tenantId, 'super_admin']
    );

    // Sign avatars for B2 hosted images
    const signedUsers = await Promise.all(result.rows.map(async (user: any) => {
      if (user.avatar_url && user.avatar_url.includes('backblazeb2.com')) {
        user.avatar_url = await generateViewUrl(user.avatar_url) || user.avatar_url;
      }
      return user;
    }));

    res.json(signedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['admin', 'user', 'tenant_admin', 'reviewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const actorRole = (req as any).user.role;
    
    // Hierarchy check: Only super_admin can promote to tenant_admin
    if (role === 'tenant_admin' && actorRole !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can assign the tenant_admin role' });
    }

    // Only tenant_admin or super_admin can create admins
    if (role === 'admin' && !['tenant_admin', 'super_admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to assign admin role' });
    }

    // Hierarchy check: Actor must have a higher level than the TARGET user
    const targetUser = await query('SELECT role FROM users WHERE id = $1 AND tenant_id = $2', [id, (req as any).tenantId]);
    if (targetUser.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const roleLevels: Record<string, number> = { user: 0, reviewer: 1, admin: 2, tenant_admin: 3, super_admin: 100 };
    const actorLevel = roleLevels[actorRole] || 0;
    const targetLevel = roleLevels[targetUser.rows[0].role] || 0;

    if (actorLevel <= targetLevel && !['super_admin', 'tenant_admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to modify users at your level or higher' });
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 AND tenant_id = $3 AND role != $4 RETURNING id',
      [role, id, (req as any).tenantId, 'super_admin']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or insufficient permissions' });
    }
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = (req as any).tenantId;

  try {
    const actorRole = (req as any).user.role;
    const roleLevels: Record<string, number> = { user: 0, reviewer: 1, admin: 2, tenant_admin: 3, super_admin: 100 };

    // Check if user exists
    const userResult = await query('SELECT role FROM users WHERE id = $1 AND tenant_id = $2 AND role != $3', [id, tenantId, 'super_admin']);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const targetLevel = roleLevels[userResult.rows[0].role] || 0;
    const actorLevel = roleLevels[actorRole] || 0;

    if (actorLevel <= targetLevel && !['super_admin', 'tenant_admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to delete users at your level or higher' });
    }

    // Prevent deleting your own account
    if (id === (req as any).user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // ─── Manual Cleanup to satisfy Foreign Key Constraints ───────────
    await query('BEGIN');
    try {
      // 1. Audit Logs: Set actor_user_id to NULL
      await query('UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id = $1', [id]);

      // 2. Ideas: Set author_id to NULL (Keep the idea, but remove the author link)
      await query('UPDATE ideas SET author_id = NULL WHERE author_id = $1', [id]);

      // 3. Comments: Set user_id to NULL (Keep the feedback/comment history)
      await query('UPDATE comments SET user_id = NULL WHERE user_id = $1', [id]);

      // 4. Votes: Delete (Votes are personal and tied to the user identity)
      await query('DELETE FROM votes WHERE user_id = $1', [id]);

      // 5. Bookmarks: Delete
      await query('DELETE FROM bookmarks WHERE user_id = $1', [id]);

      // 6. Notifications: Delete
      await query('DELETE FROM notifications WHERE user_id = $1', [id]);

      // 7. Idea Attachments: Set uploaded_by to NULL
      await query('UPDATE idea_attachments SET uploaded_by = NULL WHERE uploaded_by = $1', [id]);

      // 8. Idea Scores: Delete (they are part of a unique constraint)
      await query('DELETE FROM idea_scores WHERE scored_by = $1', [id]);

      // 9. User Idea Spaces: Delete assignments
      await query('DELETE FROM user_idea_spaces WHERE user_id = $1', [id]);

      // 10. Tenant Users & Roles: Delete ALL associations for this user (across all tenants)
      //     Must delete user_roles first (FK references tenant_users.id)
      await query(
        'DELETE FROM user_roles WHERE tenant_user_id IN (SELECT id FROM tenant_users WHERE user_id = $1)',
        [id]
      );
      await query('DELETE FROM tenant_users WHERE user_id = $1', [id]);

      // 11. Finally delete the user account
      await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 AND role != $3', [id, tenantId, 'super_admin']);
      
      await query('COMMIT');
      res.json({ message: 'User and all associated data cleared/deleted successfully' });
    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const actorRole = (req as any).user.role;
    const roleLevels: Record<string, number> = { user: 0, reviewer: 1, admin: 2, tenant_admin: 3, super_admin: 100 };

    const userResult = await query('SELECT role FROM users WHERE id = $1 AND tenant_id = $2', [id, (req as any).tenantId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const targetLevel = roleLevels[userResult.rows[0].role] || 0;
    const actorLevel = roleLevels[actorRole] || 0;

    if (actorLevel <= targetLevel && !['super_admin', 'tenant_admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to reset passwords for users at your level or higher' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3 AND role != $4 RETURNING id',
      [hashedPassword, id, (req as any).tenantId, 'super_admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found in this organization' });
    }

    res.json({ message: 'User password updated successfully' });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStats = async (req: any, res: Response) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role != 'super_admin')::int                         AS total_users,
        (SELECT COUNT(*) FROM ideas WHERE tenant_id = $1)::int                                                  AS total_ideas,
        (SELECT COUNT(*) FROM comments WHERE tenant_id = $1)::int                                               AS total_comments,
        (SELECT COUNT(*) FROM votes WHERE type = 'up' AND tenant_id = $1)::int                                AS total_votes,
        (SELECT COUNT(*) FROM users  WHERE tenant_id = $1 AND role != 'super_admin' AND created_at > NOW() - INTERVAL '30 days')::int AS new_users_30d,
        (SELECT COUNT(*) FROM ideas  WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days')::int AS new_ideas_30d,
        (SELECT COUNT(*) FROM users  WHERE tenant_id = $1 AND role = 'admin')::int                             AS admin_count,
        (
          CASE WHEN (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role != 'super_admin') = 0 THEN 0
          ELSE ROUND(
            100.0 * (SELECT COUNT(DISTINCT user_id) FROM votes WHERE tenant_id = $1 AND user_id NOT IN (SELECT id FROM users WHERE role = 'super_admin')) / 
            (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role != 'super_admin')
          ) END
        )::int AS engagement_rate
    `, [req.tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecentActivity = async (req: any, res: Response) => {
  try {
    // Get last 5 audit log entries; fall back to user registrations if audit_logs is empty
    const logs = await query(`
      SELECT 
        COALESCE(u.name, 'System') AS actor,
        al.action,
        al.entity_type,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      WHERE al.tenant_id = $1 AND (u.role IS NULL OR u.role != 'super_admin')
      ORDER BY al.created_at DESC
      LIMIT 5
    `, [req.tenantId]);

    if (logs.rows.length > 0) {
      return res.json(logs.rows);
    }

    // Fallback: latest user registrations and idea submissions
    const fallback = await query(`
      SELECT name AS actor, 'registered' AS action, 'user' AS entity_type, created_at
      FROM users WHERE tenant_id = $1 AND role != 'super_admin' ORDER BY created_at DESC LIMIT 5
    `, [req.tenantId]);
    res.json(fallback.rows);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getAdminCategories = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    // Auto-archive eligible categories:
    // 1. Not a default category
    // 2. Is currently active
    // 3. Created more than 30 days ago
    // 4. Has no ideas (which implies no comments/votes since they cascade or link to ideas)
    await query(`
      UPDATE categories 
      SET is_active = false, updated_at = NOW()
      WHERE (tenant_id = $1 OR tenant_id IS NULL)
      AND is_active = true 
      AND is_default = false
      AND created_at < NOW() - INTERVAL '30 days'
      AND NOT EXISTS (SELECT 1 FROM ideas WHERE category_id = categories.id)
    `, [tenantId]);

    const result = await query(
      `SELECT c.id, c.name, c.description, c.slug, c.is_default, c.tenant_id, c.manager_id, 
              c.parent_id, c.is_active, c.created_at, c.color,
              u.name as manager_name,
              p.name as parent_name,
              (SELECT COUNT(*) FROM ideas WHERE category_id = c.id)::int as ideas_count
       FROM categories c
       LEFT JOIN users u ON c.manager_id = u.id
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.tenant_id = $1 OR c.tenant_id IS NULL
       ORDER BY c.name`,
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCategory = async (req: any, res: Response) => {
  const { name, description, manager_id, parent_id, color } = req.body;
  const actor = (req as any).user;
  const tenant_id = req.tenantId;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Category name must be at least 2 characters' });
  }

  try {
    // Restriction for 'admin' role
    if (actor.role === 'admin') {
      if (!parent_id) {
        return res.status(403).json({ message: 'Admins cannot create top-level categories' });
      }
      
      // Verify admin manages the parent category
      const parentCheck = await query('SELECT manager_id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [parent_id, tenant_id]);
      if (parentCheck.rows.length === 0) return res.status(404).json({ message: 'Parent category not found' });
      
      if (parentCheck.rows[0].manager_id !== actor.id) {
        return res.status(403).json({ message: 'You can only create sub-categories for categories you manage' });
      }
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const result = await query(
      `INSERT INTO categories (name, description, slug, tenant_id, manager_id, parent_id, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name.trim(), description || '', slug, tenant_id, manager_id || null, parent_id || null, color || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'A category with this name already exists' });
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCategory = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, description, manager_id, parent_id, is_active, color } = req.body;
  const actor = (req as any).user;
  const tenant_id = req.tenantId;

  try {
    // Restriction check for 'admin'
    if (actor.role === 'admin') {
      const existing = await query('SELECT manager_id, parent_id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [id, tenant_id]);
      if (existing.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
      
      const category = existing.rows[0];
      
      // Admin can only edit if they are the manager of THIS category, OR manager of the PARENT
      const isManagerOfCurrent = category.manager_id === actor.id;
      
      let isManagerOfParent = false;
      if (category.parent_id) {
        const parent = await query('SELECT manager_id FROM categories WHERE id = $1', [category.parent_id]);
        isManagerOfParent = parent.rows[0]?.manager_id === actor.id;
      }

      if (!isManagerOfCurrent && !isManagerOfParent) {
        return res.status(403).json({ message: 'Insufficient permissions to edit this category' });
      }

      // If changing parent, must manage the new parent
      if (parent_id && parent_id !== category.parent_id) {
        const newParent = await query('SELECT manager_id FROM categories WHERE id = $1', [parent_id]);
        if (newParent.rows[0]?.manager_id !== actor.id) {
          return res.status(403).json({ message: 'You can only move categories to parents that you manage' });
        }
      }
    }
    const setParts: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      setParts.push(`name = $${paramCount}, slug = $${paramCount + 1}`);
      values.push(name.trim(), name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      paramCount += 2;
    }
    if (description !== undefined) {
      setParts.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (manager_id !== undefined) {
      setParts.push(`manager_id = $${paramCount}`);
      values.push(manager_id || null);
      paramCount++;
    }
    if (parent_id !== undefined) {
      setParts.push(`parent_id = $${paramCount}`);
      values.push(parent_id || null);
      paramCount++;
    }
    if (is_active !== undefined) {
      setParts.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    if (color !== undefined) {
      setParts.push(`color = $${paramCount}`);
      values.push(color || null);
      paramCount++;
    }

    values.push(id, req.tenantId);
    const updateQuery = `UPDATE categories SET ${setParts.join(', ')} WHERE id = $${paramCount} AND (tenant_id = $${paramCount + 1} OR tenant_id IS NULL) RETURNING *`;

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found or no permission' });

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'A category with this name already exists' });
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCategory = async (req: any, res: Response) => {
  const { id } = req.params;
  const actorRole = (req as any).user.role;
  
  if (actorRole !== 'tenant_admin' && actorRole !== 'super_admin') {
    return res.status(403).json({ message: 'Only tenant admins can delete categories completely' });
  }

  try {
    const check = await query(
      'SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)',
      [id, req.tenantId]
    );
    if (check.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    
    const ideaCheck = await query('SELECT COUNT(*) FROM ideas WHERE category_id = $1', [id]);
    if (parseInt(ideaCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete category because it contains ideas' });
    }

    await query('DELETE FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)', [id, req.tenantId]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const archiveCategory = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const check = await query(
      'SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)',
      [id, req.tenantId]
    );
    if (check.rows.length === 0) return res.status(404).json({ message: 'Category not found' });

    await query(
      'UPDATE categories SET is_active = false WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Category archived successfully' });
  } catch (error) {
    console.error('Archive category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Idea Spaces ──────────────────────────────────────────────────────────────

export const getIdeaSpaces = async (req: any, res: Response) => {
  try {
    const { role, id: userId } = (req as any).user;
    
    let result;
    if (['admin', 'tenant_admin', 'super_admin'].includes(role)) {
      result = await query(
        'SELECT * FROM idea_spaces WHERE tenant_id = $1 ORDER BY name',
        [req.tenantId]
      );
    } else {
      result = await query(
        `SELECT s.* FROM idea_spaces s
         JOIN user_idea_spaces uis ON s.id = uis.idea_space_id
         WHERE s.tenant_id = $1 AND uis.user_id = $2
         ORDER BY s.name`,
        [req.tenantId, userId]
      );
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Get idea spaces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createIdeaSpace = async (req: any, res: Response) => {
  const { name, description } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Space name must be at least 2 characters' });
  }
  const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  try {
    const actorRole = (req as any).user.role;
    if (actorRole !== 'tenant_admin' && actorRole !== 'super_admin') {
      return res.status(403).json({ message: 'Only tenant admins can create idea spaces' });
    }

    const result = await query(
      'INSERT INTO idea_spaces (tenant_id, name, key, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.tenantId, name, key, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'Space already exists' });
    console.error('Create idea space error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteIdeaSpace = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const actorRole = (req as any).user.role;
    if (actorRole !== 'tenant_admin' && actorRole !== 'super_admin') {
      return res.status(403).json({ message: 'Only tenant admins can delete idea spaces' });
    }

    await query('DELETE FROM idea_spaces WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    res.json({ message: 'Idea space deleted' });
  } catch (error) {
    console.error('Delete idea space error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── User Idea Space Allocation ──────────────────────────────────────────────

export const getUserSpaces = async (req: any, res: Response) => {
  const { userId } = req.params;
  try {
    const result = await query(
      `SELECT s.id, s.name FROM idea_spaces s
       JOIN user_idea_spaces uis ON s.id = uis.idea_space_id
       WHERE uis.user_id = $1 AND uis.tenant_id = $2`,
      [userId, req.tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user spaces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignUserSpaces = async (req: any, res: Response) => {
  const { userId } = req.params;
  const { spaceIds } = req.body; // Array of space IDs

  if (!Array.isArray(spaceIds)) {
    return res.status(400).json({ message: 'spaceIds must be an array' });
  }

  try {
    const actorRole = (req as any).user.role;
    const roleLevels: Record<string, number> = { user: 0, reviewer: 1, admin: 2, tenant_admin: 3, super_admin: 100 };

    const userResult = await query('SELECT role FROM users WHERE id = $1 AND tenant_id = $2', [userId, req.tenantId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const targetLevel = roleLevels[userResult.rows[0].role] || 0;
    const actorLevel = roleLevels[actorRole] || 0;

    if (actorLevel <= targetLevel && !['super_admin', 'tenant_admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to manage spaces for users at your level or higher' });
    }

    // Start transaction
    await query('BEGIN');

    // 1. Clear existing assignments
    await query('DELETE FROM user_idea_spaces WHERE user_id = $1 AND tenant_id = $2', [userId, req.tenantId]);

    // 2. Add new assignments
    for (const spaceId of spaceIds) {
      await query(
        'INSERT INTO user_idea_spaces (user_id, idea_space_id, tenant_id) VALUES ($1, $2, $3)',
        [userId, spaceId, req.tenantId]
      );
    }

    await query('COMMIT');
    res.json({ message: 'Idea spaces assigned successfully' });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Assign user spaces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
