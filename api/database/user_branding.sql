-- User Branding Settings Table
-- Stores user-specific branding configuration including logo
-- Run this migration in phpMyAdmin to enable persistent branding

CREATE TABLE IF NOT EXISTS user_branding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    logo_url LONGTEXT,
    company_name VARCHAR(255),
    primary_color VARCHAR(20) DEFAULT '#0ea5e9',
    email_signature TEXT,
    footer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
