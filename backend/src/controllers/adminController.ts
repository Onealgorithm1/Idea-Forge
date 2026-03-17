import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const getAllUsers = async (req: any, res: Response) => {
  try {
    const result = await query('SELECT id, name, email, avatar_url, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC', [req.tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    await query('UPDATE users SET role = $1 WHERE id = $2 AND tenant_id = $3', [role, id, (req as any).tenantId]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const user = await query('SELECT role FROM users WHERE id = $1 AND tenant_id = $2', [id, (req as any).tenantId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting your own account (optional but safer)
    if (id === (req as any).user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [id, (req as any).tenantId]);
    res.json({ message: 'User deleted successfully' });
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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query('UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id', [hashedPassword, id, (req as any).tenantId]);
    
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
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1)::int                                            AS total_users,
        (SELECT COUNT(*) FROM ideas WHERE tenant_id = $1)::int                                            AS total_ideas,
        (SELECT COUNT(*) FROM comments WHERE tenant_id = $1)::int                                         AS total_comments,
        (SELECT COUNT(*) FROM votes WHERE type = 'up' AND tenant_id = $1)::int                          AS total_votes,
        (SELECT COUNT(*) FROM users  WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days')::int AS new_users_30d,
        (SELECT COUNT(*) FROM ideas  WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days')::int AS new_ideas_30d,
        (SELECT COUNT(*) FROM users  WHERE tenant_id = $1 AND (role = 'admin' OR role = 'super_admin'))::int  AS admin_count,
        (
          CASE WHEN (SELECT COUNT(*) FROM users WHERE tenant_id = $1) = 0 THEN 0
          ELSE ROUND(
            100.0 * (SELECT COUNT(DISTINCT user_id) FROM votes WHERE tenant_id = $1) / (SELECT COUNT(*) FROM users WHERE tenant_id = $1)
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
      WHERE al.tenant_id = $1
      ORDER BY al.created_at DESC
      LIMIT 5
    `, [req.tenantId]);

    if (logs.rows.length > 0) {
      return res.json(logs.rows);
    }

    // Fallback: latest user registrations and idea submissions
    const fallback = await query(`
      SELECT name AS actor, 'registered' AS action, 'user' AS entity_type, created_at
      FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5
    `, [req.tenantId]);
    res.json(fallback.rows);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
