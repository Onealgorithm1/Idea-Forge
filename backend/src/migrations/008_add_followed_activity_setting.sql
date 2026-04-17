-- Migration: 008_add_followed_activity_setting.sql
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS notify_on_followed_activity BOOLEAN DEFAULT TRUE;
