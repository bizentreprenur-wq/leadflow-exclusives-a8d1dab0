-- Audit Logs Table for BamLead
-- Stores all user actions with IP addresses and metadata
-- Run this SQL in your MySQL database

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    category ENUM('auth', 'search', 'leads', 'email', 'crm', 'calendar', 'settings', 'admin', 'payment', 'export', 'system') NOT NULL DEFAULT 'system',
    entity_type VARCHAR(50) NULL COMMENT 'Type of entity affected (lead, template, campaign, etc.)',
    entity_id VARCHAR(100) NULL COMMENT 'ID of the affected entity',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Supports IPv6',
    user_agent VARCHAR(512) NULL,
    request_method VARCHAR(10) NULL,
    request_path VARCHAR(255) NULL,
    request_data JSON NULL COMMENT 'Sanitized request data (no passwords)',
    response_status INT NULL COMMENT 'HTTP response code',
    metadata JSON NULL COMMENT 'Additional context data',
    status ENUM('success', 'failure', 'pending') NOT NULL DEFAULT 'success',
    error_message TEXT NULL,
    duration_ms INT NULL COMMENT 'Request duration in milliseconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for efficient querying
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_category (category),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_action_date (user_id, action, created_at),
    
    -- Foreign key (optional - allows logging for unauthenticated actions)
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Partitioning suggestion for high-volume systems (run separately if needed):
-- ALTER TABLE audit_logs PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
--     PARTITION p_2024_q1 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01')),
--     PARTITION p_2024_q2 VALUES LESS THAN (UNIX_TIMESTAMP('2024-07-01')),
--     PARTITION p_2024_q3 VALUES LESS THAN (UNIX_TIMESTAMP('2024-10-01')),
--     PARTITION p_2024_q4 VALUES LESS THAN (UNIX_TIMESTAMP('2025-01-01')),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- Create view for admin dashboard
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
    DATE(created_at) as log_date,
    category,
    action,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count,
    AVG(duration_ms) as avg_duration_ms
FROM audit_logs
GROUP BY DATE(created_at), category, action;

-- Common action types reference:
-- auth: login, logout, register, password_reset, session_refresh, login_failed
-- search: gmb_search, platform_search, lead_search
-- leads: lead_save, lead_verify, lead_update, lead_delete, lead_export
-- email: email_send, email_bulk_send, email_schedule, template_create, template_update, campaign_create
-- crm: crm_connect, crm_disconnect, crm_export, crm_sync
-- calendar: calendar_connect, calendar_disconnect, event_create, event_delete
-- settings: profile_update, branding_update, smtp_configure, password_change
-- admin: user_list, user_update, user_delete, grant_free_account, stats_view
-- payment: subscription_create, subscription_cancel, payment_success, payment_failed
-- export: csv_export, pdf_export, drive_export
-- system: api_error, rate_limit, security_block
