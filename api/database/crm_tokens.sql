-- Add CRM OAuth token columns to users table
-- Run this migration to enable CRM integrations

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hubspot_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hubspot_refresh_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salesforce_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salesforce_refresh_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salesforce_instance_url VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pipedrive_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pipedrive_refresh_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pipedrive_api_domain VARCHAR(255) DEFAULT NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_hubspot ON users(hubspot_token(255));
CREATE INDEX IF NOT EXISTS idx_users_salesforce ON users(salesforce_token(255));
CREATE INDEX IF NOT EXISTS idx_users_pipedrive ON users(pipedrive_token(255));
