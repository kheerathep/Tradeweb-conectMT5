CREATE TABLE trading_accounts (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    account_name    VARCHAR(200)    NOT NULL,
    broker          VARCHAR(200),
    mt5_server      VARCHAR(200),
    account_type    ENUM('PERSONAL','DEMO','PROP','OTHER') NOT NULL DEFAULT 'PERSONAL',
    currency        VARCHAR(10)     NOT NULL DEFAULT 'USD',
    initial_balance DECIMAL(18,2)   DEFAULT 0.00,
    status          ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_accounts_user (user_id),
    INDEX idx_accounts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
