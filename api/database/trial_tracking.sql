-- Trial usage tracking migration
-- Prevents customers from getting unlimited trials after canceling
-- Run this in phpMyAdmin on your Hostinger database

-- Add field to track if user has ever used their trial
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS had_trial TINYINT(1) DEFAULT 0 COMMENT 'Has user ever used a trial subscription',
ADD COLUMN IF NOT EXISTS first_subscription_at DATETIME NULL COMMENT 'Date of first ever subscription';

-- Index for trial eligibility checks
CREATE INDEX IF NOT EXISTS idx_users_had_trial ON users(had_trial);

-- Backfill: Mark existing subscribers as having used their trial
UPDATE users 
SET had_trial = 1, 
    first_subscription_at = COALESCE(first_subscription_at, created_at)
WHERE subscription_status IN ('active', 'trial', 'expired', 'cancelled')
   OR subscription_plan IS NOT NULL
   OR id IN (SELECT DISTINCT user_id FROM subscriptions);
