CREATE TABLE trade_tags (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    trade_id    BIGINT          NOT NULL,
    tag_name    VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tags_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    CONSTRAINT uk_tags_trade_name UNIQUE (trade_id, tag_name),
    INDEX idx_tags_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
