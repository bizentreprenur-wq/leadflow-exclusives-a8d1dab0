-- Telnyx Voice Configuration Table
-- Run this migration on your MySQL database

CREATE TABLE IF NOT EXISTS telnyx_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    api_key VARCHAR(255) NULL,
    connection_id VARCHAR(255) NULL,
    phone_number VARCHAR(50) NULL,
    voice VARCHAR(100) DEFAULT 'Telnyx.Kokoro',
    greeting_message TEXT NULL,
    system_prompt TEXT NULL,
    enabled TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
