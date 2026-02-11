-- Twilio Voice & SMS Configuration Table
-- Replaces telnyx_config. The TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are stored in config.php
-- This table stores per-user phone assignments and voice settings

CREATE TABLE IF NOT EXISTS twilio_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    phone_number VARCHAR(50) NULL,
    phone_number_sid VARCHAR(255) NULL COMMENT 'Twilio phone number SID for management',
    voice VARCHAR(100) DEFAULT 'Polly.Joanna',
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

-- Active Calls Tracking Table
CREATE TABLE IF NOT EXISTS twilio_active_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    call_sid VARCHAR(255) NOT NULL UNIQUE,
    destination_number VARCHAR(50) NOT NULL,
    lead_id INT NULL,
    lead_name VARCHAR(255) NULL,
    status ENUM('initiated', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled') DEFAULT 'initiated',
    transcript JSON NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_call_sid (call_sid),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration from telnyx_config: Copy data then drop old table
-- INSERT INTO twilio_config (user_id, phone_number, voice, greeting_message, system_prompt, enabled, provisioned, provision_status, provisioned_at)
-- SELECT user_id, phone_number, 'Polly.Joanna', greeting_message, system_prompt, enabled, provisioned, provision_status, provisioned_at
-- FROM telnyx_config;
-- DROP TABLE IF EXISTS telnyx_active_calls;
-- DROP TABLE IF EXISTS telnyx_config;
