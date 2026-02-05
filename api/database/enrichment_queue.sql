-- Enrichment Queue Table for BamLead
-- Stores pending/completed Firecrawl enrichment jobs
-- Enables background processing with automatic retries
-- Run this script in your Hostinger phpMyAdmin

CREATE TABLE IF NOT EXISTS enrichment_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    search_type ENUM('gmb', 'platform') DEFAULT 'gmb',
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    result_data JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Indexes for efficient querying
    INDEX idx_session_status (session_id, status),
    INDEX idx_status_created (status, created_at),
    INDEX idx_lead_session (lead_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cleanup old queue entries (run via cron daily)
-- Keeps completed entries for 7 days, failed for 3 days
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS cleanup_enrichment_queue()
BEGIN
    -- Remove completed entries older than 7 days
    DELETE FROM enrichment_queue 
    WHERE status = 'completed' 
    AND completed_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Remove failed entries older than 3 days
    DELETE FROM enrichment_queue 
    WHERE status = 'failed' 
    AND completed_at < DATE_SUB(NOW(), INTERVAL 3 DAY);
    
    -- Remove stale processing entries (stuck for over 1 hour)
    UPDATE enrichment_queue 
    SET status = 'pending', retry_count = retry_count + 1
    WHERE status = 'processing' 
    AND started_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Remove entries that exceeded max retries
    DELETE FROM enrichment_queue 
    WHERE status = 'pending' 
    AND retry_count >= 5;
END //

DELIMITER ;