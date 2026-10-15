CREATE TABLE sync_batches (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    integration_id      BIGINT          NOT NULL,
    batch_id            VARCHAR(36)     COMMENT 'Client-generated UUID',
    records_received    INT             NOT NULL DEFAULT 0,
    records_inserted    INT             NOT NULL DEFAULT 0,
    records_duplicated  INT             NOT NULL DEFAULT 0,
    records_rejected    INT             NOT NULL DEFAULT 0,
    rejection_details   JSON,
    checkpoint_before   TIMESTAMP       NULL,
    checkpoint_after    TIMESTAMP       NULL,
    http_status         INT,
    received_at         TIMESTAMP       NOT NULL,
    processed_at        TIMESTAMP       NULL,
    
    CONSTRAINT fk_batches_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id),
    INDEX idx_batches_integration (integration_id),
    INDEX idx_batches_received (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
