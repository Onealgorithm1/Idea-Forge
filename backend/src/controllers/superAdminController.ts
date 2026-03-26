import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { sendEmail } from '../config/mail.js';

export const getTenantDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tenantResult = await query('SELECT * FROM tenants WHERE id = $1', [id]);
    if (tenantResult.rows.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    
    const usersResult = await query(
      'SELECT id, name, email, role, status, created_at, last_login_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM ideas WHERE tenant_id = $1) as total_ideas,
        (SELECT COUNT(*) FROM comments WHERE tenant_id = $1) as total_comments,
        (SELECT COUNT(*) FROM votes WHERE tenant_id = $1) as total_votes
    `, [id]);

    res.json({
      ...tenantResult.rows[0],
      users: usersResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get tenant detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTenantAdmin = async (req: Request, res: Response) => {
  const { tenantId, name, email, password } = req.body;

  if (!tenantId || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // 1. Check license limit
    const tenant = await query('SELECT name, slug, max_users FROM tenants WHERE id = $1', [tenantId]);
    if (tenant.rows.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    
    const currentUsers = await query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const maxUsers = tenant.rows[0].max_users || 5;

    if (parseInt(currentUsers.rows[0].count) >= maxUsers) {
      return res.status(403).json({ message: `License limit reached (${maxUsers} users). Upgrade required.` });
    }

    // 2. Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'User with this email already exists' });

    // 3. Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, role, tenant_id, status)
       VALUES ($1, $2, $3, 'admin', $4, 'active') RETURNING id, name, email, role, tenant_id`,
      [name, email, hashedPassword, tenantId]
    );

    // 4. Send Response Immediately
    res.status(201).json({
      message: 'Tenant admin created successfully and email sent',
      user: newUser.rows[0]
    });

    // 5. Send Email in Background
    const orgName = tenant.rows[0]?.name || 'your organization';
    const orgSlug = tenant.rows[0]?.slug || 'default';
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${orgSlug}/login`;
    
    const emailSubject = `Welcome to IdeaForge - Admin Credentials for ${orgName}`;
    const emailText = `Hello ${name},\n\nYou have been added as an admin for ${orgName} on the IdeaForge platform.\n\nOrganization: ${orgName}\nLogin URL: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.`;
    
    try {
      console.log(`[Background] Sending tenant admin email to ${email} for tenant ${orgSlug}...`);
      await sendEmail(email, emailSubject, emailText);
    } catch (err) {
      console.error('[Background] Email sending failed in createTenantAdmin:', err);
    }
  } catch (error) {
    console.error('Create tenant admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTenantMaxUsers = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { max_users } = req.body;

  if (max_users === undefined || isNaN(parseInt(max_users))) {
    return res.status(400).json({ message: 'Invalid max_users value' });
  }

  try {
    const result = await query(
      'UPDATE tenants SET max_users = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [parseInt(max_users), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tenant max users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitSupportRequest = async (req: Request, res: Response) => {
  const { subject, message } = req.body;
  const user = (req as any).user;
  const tenantId = (req as any).tenantId;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    // 1. Store in DB
    const result = await query(
      'INSERT INTO support_requests (tenant_id, user_id, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, user.id, subject, message]
    );

    // Notify Platform Support (Configured in .env)
    const adminEmail = process.env.SMTP_USER;

    if (adminEmail) {
      const tenantInfo = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
      const tenantName = tenantInfo.rows[0]?.name || 'Unknown';
      
      const emailSubject = `[Support Request] ${subject} - ${tenantName}`;
      const emailText = `New support request from ${user.email} (${tenantName}):\n\nSubject: ${subject}\n\nMessage:\n${message}\n\nTenant ID: ${tenantId}`;
      
      // Send Email asynchronously
      sendEmail(adminEmail, emailSubject, emailText).catch(err => {
        console.error('Background email sending error (submitSupportRequest):', err);
      });
    }

    res.status(201).json({ message: 'Support request submitted successfully', ticketId: result.rows[0].id });
  } catch (error) {
    console.error('Submit support request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listSupportRequests = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT s.*, u.name as user_name, u.email as user_email, t.name as tenant_name
      FROM support_requests s
      JOIN users u ON s.user_id = u.id
      JOIN tenants t ON s.tenant_id = t.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('List support requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;
  try {
    const result = await query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status',
      [status, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;
  try {
    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, role',
      [role, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
