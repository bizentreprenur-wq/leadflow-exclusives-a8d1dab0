-- Add smtp_config column to users table to persist per-user SMTP settings
-- This ensures SMTP configuration survives browser clears and device switches
-- Run this migration on your Hostinger MySQL database

ALTER TABLE users 
ADD COLUMN smtp_config TEXT NULL DEFAULT NULL;

-- smtp_config stores a JSON-encoded object with: host, port, username, password, fromEmail, fromName, secure
