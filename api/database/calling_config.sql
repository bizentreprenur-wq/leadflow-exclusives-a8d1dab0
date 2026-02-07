-- Calling.io Configuration Table
-- Run this migration on your MySQL database

CREATE TABLE IF NOT EXISTS calling_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    agent_id VARCHAR(255) NULL,
    phone_number VARCHAR(50) NULL,
    voice_id VARCHAR(100) DEFAULT 'professional-female',
    language VARCHAR(10) DEFAULT 'en-US',
    greeting_message TEXT NULL,
    system_prompt TEXT NULL,
    enabled TINYINT(1) DEFAULT 0,
    provisioned TINYINT(1) DEFAULT 0,
    addon_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_enabled (enabled),
    INDEX idx_addon_active (addon_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
