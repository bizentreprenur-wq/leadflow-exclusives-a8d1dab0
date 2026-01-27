-- Email Replies Table
-- Stores incoming email replies with AI classification
-- Run this in phpMyAdmin

CREATE TABLE IF NOT EXISTS email_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    campaign_id INT,
    original_send_id INT,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    subject VARCHAR(500),
    body_preview TEXT,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    intent ENUM('interested', 'scheduling', 'question', 'pricing', 'timing', 'objection', 'unsubscribe', 'general') DEFAULT 'general',
    urgency_level ENUM('hot', 'warm', 'cold') DEFAULT 'cold',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read TINYINT(1) DEFAULT 0,
    requires_action TINYINT(1) DEFAULT 0,
    action_taken_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_from_email (from_email),
    INDEX idx_sentiment (sentiment),
    INDEX idx_intent (intent),
    INDEX idx_urgency (urgency_level),
    INDEX idx_received_at (received_at),
    INDEX idx_requires_action (requires_action, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email unsubscribes tracking
CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    email VARCHAR(255) NOT NULL,
    unsubscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason ENUM('reply_request', 'link_click', 'manual', 'bounce') DEFAULT 'manual',
    UNIQUE KEY unique_user_email (user_id, email),
    INDEX idx_email (email),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add paused status fields to email_sends if not exists
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

-- Modify status enum to include paused and cancelled
ALTER TABLE email_sends 
MODIFY COLUMN status ENUM('pending', 'scheduled', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'paused', 'cancelled') DEFAULT 'pending';
