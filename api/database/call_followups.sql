-- Call Follow-ups Table
-- Automatic callback reminders and SMS follow-ups after missed calls
-- Run this migration on your MySQL database

CREATE TABLE IF NOT EXISTS call_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id INT NULL,
    lead_name VARCHAR(255) NULL,
    lead_phone VARCHAR(50) NOT NULL,
    call_log_id INT NULL COMMENT 'Reference to the original call_logs entry',
    followup_type ENUM('callback', 'sms') NOT NULL DEFAULT 'callback',
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending', 'sent', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    notes TEXT NULL,
    sms_message TEXT NULL COMMENT 'Pre-composed SMS text for sms-type follow-ups',
    executed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_scheduled (scheduled_for, status),
    INDEX idx_lead_phone (lead_phone),
    INDEX idx_call_log (call_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
