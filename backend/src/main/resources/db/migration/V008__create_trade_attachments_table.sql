CREATE TABLE trade_attachments (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    trade_id        BIGINT          NOT NULL,
    file_name       VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    content_type    VARCHAR(100),
    file_size       BIGINT,
    attachment_type ENUM('SCREENSHOT_BEFORE','SCREENSHOT_AFTER','OTHER') DEFAULT 'OTHER',
    caption         TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_attachments_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    INDEX idx_attachments_trade (trade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
