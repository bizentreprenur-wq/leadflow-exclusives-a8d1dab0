-- SMS Messages Table
-- Run this migration on your MySQL database for Autopilot SMS feature

CREATE TABLE IF NOT EXISTS sms_messages (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id VARCHAR(100) NULL,
    lead_phone VARCHAR(50) NOT NULL,
    lead_name VARCHAR(255) NULL,
    business_name VARCHAR(255) NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'delivered', 'failed', 'received') DEFAULT 'pending',
    `read` TINYINT(1) DEFAULT 0,
    external_id VARCHAR(100) NULL COMMENT 'Message ID from Telnyx Messaging API',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_lead_phone (lead_phone),
    INDEX idx_direction (direction),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled SMS Table
CREATE TABLE IF NOT EXISTS sms_scheduled (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id VARCHAR(100) NULL,
    lead_phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_scheduled (user_id, scheduled_for),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-SMS enabled leads
CREATE TABLE IF NOT EXISTS sms_auto_enabled (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id VARCHAR(100) NOT NULL,
    enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lead (user_id, lead_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
