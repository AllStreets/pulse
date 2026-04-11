-- supabase/migrations/021_notification_preference.sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
