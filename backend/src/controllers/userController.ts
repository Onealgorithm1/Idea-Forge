import { Response } from 'express';
import { query } from '../config/db.js';

export const updateProfile = async (req: any, res: Response) => {
  const { name, bio, avatar_url } = req.body;
  const user_id = req.user.id;

  try {
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, role, avatar_url, bio',
      [name || null, bio || null, avatar_url || null, user_id]
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

export const getNotificationSettings = async (req: any, res: Response) => {
  const user_id = req.user.id;
  try {
    let result = await query('SELECT * FROM notification_settings WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      await query('INSERT INTO notification_settings (user_id, notify_on_followed_activity) VALUES ($1, TRUE)', [user_id]);
      result = await query('SELECT * FROM notification_settings WHERE user_id = $1', [user_id]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateNotificationSettings = async (req: any, res: Response) => {
  const user_id = req.user.id;
  const { 
    email_enabled, 
    push_enabled, 
    notify_on_vote, 
    notify_on_comment, 
    notify_on_status_change, 
    notify_on_followed_activity,
    notify_weekly_summary
  } = req.body;
  try {
    const result = await query(
      `UPDATE notification_settings 
       SET email_enabled = COALESCE($1, email_enabled), 
           push_enabled = COALESCE($2, push_enabled), 
           notify_on_vote = COALESCE($3, notify_on_vote), 
           notify_on_comment = COALESCE($4, notify_on_comment), 
           notify_on_status_change = COALESCE($5, notify_on_status_change), 
           notify_on_followed_activity = COALESCE($6, notify_on_followed_activity),
           notify_weekly_summary = COALESCE($7, notify_weekly_summary),
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $8 RETURNING *`,
      [email_enabled, push_enabled, notify_on_vote, notify_on_comment, notify_on_status_change, notify_on_followed_activity, notify_weekly_summary, user_id]
    );
    if (result.rows.length === 0) {
        const insertResult = await query(
          `INSERT INTO notification_settings (user_id, email_enabled, push_enabled, notify_on_vote, notify_on_comment, notify_on_status_change, notify_on_followed_activity, notify_weekly_summary)
           VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, TRUE), COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, TRUE), COALESCE($8, TRUE)) RETURNING *`,
          [user_id, email_enabled, push_enabled, notify_on_vote, notify_on_comment, notify_on_status_change, notify_on_followed_activity, notify_weekly_summary]
        );
       return res.json(insertResult.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
