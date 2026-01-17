-- Add Google Calendar token columns to users table
-- Run this migration to enable Google Calendar OAuth

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_calendar_token ON users(google_calendar_token(255));
