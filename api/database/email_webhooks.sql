-- Email Webhook Events Table for BamLead
-- Stores delivery notifications from email providers (SendGrid, Mailgun, Amazon SES, etc.)
-- Run this script in your Hostinger phpMyAdmin

-- =====================================
-- EMAIL WEBHOOK EVENTS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS email_webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(64) NOT NULL,
    email_send_id INT DEFAULT NULL,
    event_type ENUM('delivered', 'opened', 'clicked', 'bounced', 'dropped', 'spam_report', 'unsubscribe', 'deferred') NOT NULL,
    provider VARCHAR(50) DEFAULT NULL COMMENT 'SendGrid, Mailgun, Amazon SES, etc.',
    recipient_email VARCHAR(255) DEFAULT NULL,
    timestamp DATETIME NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    click_url TEXT DEFAULT NULL COMMENT 'For click events - which link was clicked',
    bounce_type VARCHAR(50) DEFAULT NULL COMMENT 'hard, soft, etc.',
    bounce_reason TEXT DEFAULT NULL,
    raw_payload JSON DEFAULT NULL COMMENT 'Full webhook payload for debugging',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tracking_id (tracking_id),
    INDEX idx_email_send_id (email_send_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_processed (processed),
    FOREIGN KEY (email_send_id) REFERENCES email_sends(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- EMAIL DELIVERY STATS VIEW
-- =====================================
CREATE OR REPLACE VIEW email_delivery_stats AS
SELECT 
    es.user_id,
    DATE(es.sent_at) as send_date,
    COUNT(*) as total_sent,
    SUM(CASE WHEN es.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN es.status = 'opened' THEN 1 ELSE 0 END) as opened,
    SUM(CASE WHEN es.status = 'clicked' THEN 1 ELSE 0 END) as clicked,
    SUM(CASE WHEN es.status = 'bounced' THEN 1 ELSE 0 END) as bounced,
    SUM(CASE WHEN es.status = 'failed' THEN 1 ELSE 0 END) as failed,
    ROUND(SUM(CASE WHEN es.status = 'opened' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as open_rate,
    ROUND(SUM(CASE WHEN es.status = 'clicked' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as click_rate
FROM email_sends es
WHERE es.status != 'pending'
GROUP BY es.user_id, DATE(es.sent_at);

-- =====================================
-- ADD webhook_notified COLUMN TO email_sends
-- =====================================
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS webhook_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_provider VARCHAR(50) DEFAULT NULL;

-- Add index for faster webhook lookups
ALTER TABLE email_sends 
ADD INDEX IF NOT EXISTS idx_webhook_notified (webhook_notified);
