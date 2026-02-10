-- Telnyx Voice Configuration Table (Global API Key Model)
-- The TELNYX_API_KEY is stored in config.php (one key for all users)
-- This table stores per-user phone assignments and voice settings

CREATE TABLE IF NOT EXISTS telnyx_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    phone_number VARCHAR(50) NULL,
    phone_number_id VARCHAR(255) NULL COMMENT 'Telnyx phone number resource ID for management',
    voice VARCHAR(100) DEFAULT 'Telnyx.Kokoro',
    greeting_message TEXT NULL,
    system_prompt TEXT NULL,
    enabled TINYINT(1) DEFAULT 0,
    provisioned TINYINT(1) DEFAULT 0 COMMENT 'Whether a number has been auto-provisioned',
    provision_status ENUM('none', 'pending', 'active', 'failed', 'released') DEFAULT 'none',
    provisioned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_enabled (enabled),
    INDEX idx_provision_status (provision_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: If upgrading from per-user API key model, run:
-- ALTER TABLE telnyx_config DROP COLUMN IF EXISTS api_key;
-- ALTER TABLE telnyx_config DROP COLUMN IF EXISTS connection_id;
-- ALTER TABLE telnyx_config ADD COLUMN IF NOT EXISTS phone_number_id VARCHAR(255) NULL AFTER phone_number;
-- ALTER TABLE telnyx_config ADD COLUMN IF NOT EXISTS provision_status ENUM('none','pending','active','failed','released') DEFAULT 'none' AFTER provisioned;
-- ALTER TABLE telnyx_config ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMP NULL AFTER provision_status;

-- Active Calls Tracking Table
CREATE TABLE IF NOT EXISTS telnyx_active_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    call_control_id VARCHAR(255) NOT NULL UNIQUE,
    call_leg_id VARCHAR(255) NULL,
    destination_number VARCHAR(50) NOT NULL,
    lead_id INT NULL,
    lead_name VARCHAR(255) NULL,
    status ENUM('initiated', 'ringing', 'answered', 'speaking', 'listening', 'ended') DEFAULT 'initiated',
    transcript JSON NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_call_control_id (call_control_id),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
