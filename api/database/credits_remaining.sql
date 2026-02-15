-- Add credits_remaining column to users table for persistent credit tracking
-- Run this in phpMyAdmin

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits_remaining INT DEFAULT 25;

-- Add daily_credits_reset tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_daily_credit_reset DATE NULL;
