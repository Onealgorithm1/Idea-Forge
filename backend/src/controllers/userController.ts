import { Response } from 'express';
import { query } from '../config/db.js';

export const updateProfile = async (req: any, res: Response) => {
  const { name, bio } = req.body;
  const user_id = req.user.id;

  try {
    const result = await query(
      'UPDATE users SET name = $1, bio = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, email, role, avatar_url, bio',
      [name, bio, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadAvatar = async (req: any, res: Response) => {
  const user_id = req.user.id;
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Use forward slashes for URL consistency
  const avatar_url = `/uploads/avatars/${req.file.filename}`;

  try {
    await query('UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [avatar_url, user_id]);
    res.json({ avatar_url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  const user_id = req.user.id;
  try {
    const result = await query('SELECT id, name, email, role, avatar_url, bio FROM users WHERE id = $1', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
