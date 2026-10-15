CREATE TABLE import_jobs (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    integration_id      BIGINT          NOT NULL,
    job_type            ENUM('INITIAL_IMPORT','RESYNC','MANUAL_RECOVERY') NOT NULL,
    status              ENUM('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    import_from         TIMESTAMP       NULL,
    import_to           TIMESTAMP       NULL,
    total_batches       INT             DEFAULT 0,
    completed_batches   INT             DEFAULT 0,
    total_deals         INT             DEFAULT 0,
    imported_deals      INT             DEFAULT 0,
    error_message       TEXT,
    started_at          TIMESTAMP       NULL,
    completed_at        TIMESTAMP       NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_jobs_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id),
    INDEX idx_jobs_integration (integration_id),
    INDEX idx_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
