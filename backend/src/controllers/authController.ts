import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// ─── Regular User Login ──────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  const { email, password, tenantSlug = 'default' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // 1. Get tenant details by slug first
    const tenantResult = await query('SELECT id FROM tenants WHERE slug = $1 AND status = $2', [tenantSlug, 'active']);
    if (tenantResult.rows.length === 0) return res.status(404).json({ message: 'Organization not found' });
    const tenantId = tenantResult.rows[0].id;

    // 2. Find user within this tenant only
    const user = await query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (user.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials for this organization' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.rows[0].status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact your administrator.' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.rows[0].id]);

    const tokenPayload: any = {
      id: user.rows[0].id,
      role: user.rows[0].role,
      tenantId: user.rows[0].tenant_id,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '24h' });

    res.json({
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
        tenantId: user.rows[0].tenant_id,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Regular User Register ───────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  const { name, email, password, tenantSlug = 'default' } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // 1. Get tenant by slug
    const tenantResult = await query('SELECT * FROM tenants WHERE slug = $1 AND status = $2', [tenantSlug, 'active']);
    if (tenantResult.rows.length === 0) return res.status(404).json({ message: 'Organization not found' });
    const tenant = tenantResult.rows[0];

    // 2. Check if user already exists IN THIS TENANT
    const userExists = await query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenant.id]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'User already exists in this organization' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, role, tenant_id) 
       VALUES ($1, $2, $3, 'user', $4) RETURNING id, name, email, role, tenant_id`,
      [name, email, hashedPassword, tenant.id]
    );

    // Add to tenant_users
    await query(
      'INSERT INTO tenant_users (tenant_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [tenant.id, newUser.rows[0].id]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, role: newUser.rows[0].role, tenantId: tenant.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', details: error instanceof Error ? error.message : String(error) });
  }
};

// ─── Super Admin Login ────────────────────────────────────────────────────────
export const superAdminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await query('SELECT * FROM users WHERE email = $1 AND is_super_admin = TRUE', [email]);
    if (user.rows.length === 0) return res.status(403).json({ message: 'Unauthorized: not a super admin' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.rows[0].id, role: 'super_admin', isSuperAdmin: true },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.json({
      user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email, isSuperAdmin: true },
      token,
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Create first Super Admin ─────────────────────────────────────────────────
// This endpoint only works if no super admin exists yet
export const seedSuperAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const existing = await query('SELECT id FROM users WHERE is_super_admin = TRUE LIMIT 1');
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Super admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, role, is_super_admin, tenant_id)
       VALUES ($1, $2, $3, 'super_admin', TRUE, '00000000-0000-0000-0000-000000000001')
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'Super admin created', user: newUser.rows[0] });
  } catch (error) {
    console.error('Seed super admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
