-- Add payment method tracking fields to users table
-- Run this migration on your Hostinger MySQL database

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_payment_method TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_ends_at DATETIME NULL;

-- Index for trial expiration checks
CREATE INDEX IF NOT EXISTS idx_users_trial_ends ON users(trial_ends_at);
