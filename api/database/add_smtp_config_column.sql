-- Add smtp_config column to email_sends table for drip/scheduled sending
-- This stores the user's SMTP credentials so the cron job can send with their config
-- Run this migration on your Hostinger MySQL database

ALTER TABLE email_sends 
ADD COLUMN smtp_config TEXT NULL DEFAULT NULL AFTER body_html;

-- smtp_config stores a JSON-encoded object with: host, port, username, password, secure, from_email, from_name
-- The cron job reads this when processing scheduled emails so it uses the user's SMTP instead of the server default
