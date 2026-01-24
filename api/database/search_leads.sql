-- Search Leads Table for BamLead
-- Stores all search results per customer for consistency across the system
-- Leads are auto-deleted after 30 days to keep the database clean
-- Run this script in your Hostinger phpMyAdmin

CREATE TABLE IF NOT EXISTS search_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id VARCHAR(100) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    website VARCHAR(500),
    email VARCHAR(255),
    rating DECIMAL(2,1),
    source_type ENUM('gmb', 'platform') NOT NULL DEFAULT 'gmb',
    platform VARCHAR(100),
    
    -- AI Scoring fields
    ai_classification ENUM('hot', 'warm', 'cold'),
    lead_score INT DEFAULT 0,
    success_probability INT DEFAULT 0,
    recommended_action ENUM('call', 'email', 'both'),
    call_score INT DEFAULT 0,
    email_score INT DEFAULT 0,
    urgency ENUM('immediate', 'this_week', 'nurture'),
    pain_points JSON,
    ready_to_call BOOLEAN DEFAULT FALSE,
    
    -- Website analysis
    website_analysis JSON,
    
    -- Search context (to group leads from the same search)
    search_query VARCHAR(255),
    search_location VARCHAR(255),
    search_session_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP AS (DATE_ADD(created_at, INTERVAL 30 DAY)) STORED,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lead (user_id, lead_id),
    INDEX idx_user_id (user_id),
    INDEX idx_source_type (source_type),
    INDEX idx_search_session (search_session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_ai_classification (ai_classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled event to clean up expired leads (run daily)
-- Note: You need to enable the event scheduler on your MySQL server
-- Run: SET GLOBAL event_scheduler = ON;

DELIMITER //

CREATE EVENT IF NOT EXISTS cleanup_expired_search_leads
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM search_leads WHERE expires_at < NOW();
END //

DELIMITER ;

-- Alternative: If events aren't supported, create a cleanup procedure
-- that can be called via cron job

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS cleanup_old_search_leads()
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    
    -- Delete leads older than 30 days
    DELETE FROM search_leads WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET deleted_count = ROW_COUNT();
    
    -- Log the cleanup
    INSERT INTO usage_tracking (user_id, action_type, credits_used, notes)
    VALUES (0, 'cleanup', 0, CONCAT('Cleaned up ', deleted_count, ' expired search leads'));
END //

DELIMITER ;
