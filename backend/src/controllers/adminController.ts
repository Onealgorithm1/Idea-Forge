import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, name, email, avatar_url, role, created_at FROM users ORDER BY created_at DESC');
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
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
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
    const user = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting your own account (optional but safer)
    if (id === (req as any).user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
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

    const result = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [hashedPassword, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User password updated successfully' });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
