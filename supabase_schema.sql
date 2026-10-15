-- =============================================================================
-- TradeWeb Journal - Supabase / PostgreSQL Complete Schema
-- Copy and paste this directly into Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    username        VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    display_name    VARCHAR(200),
    timezone        VARCHAR(50)     DEFAULT 'UTC',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_users_email    UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
);

-- 2. Trading Accounts Table
CREATE TABLE IF NOT EXISTS trading_accounts (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    account_name    VARCHAR(200)    NOT NULL,
    broker          VARCHAR(200),
    mt5_server      VARCHAR(200),
    account_type    VARCHAR(50)     NOT NULL DEFAULT 'PERSONAL',
    currency        VARCHAR(10)     NOT NULL DEFAULT 'USD',
    initial_balance DECIMAL(18,2)   DEFAULT 0.00,
    status          VARCHAR(50)     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON trading_accounts(status);

-- 3. MT5 Integrations Table
CREATE TABLE IF NOT EXISTS mt5_integrations (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trading_account_id      BIGINT          NOT NULL,
    token_hash              VARCHAR(64)     NOT NULL,
    token_prefix            VARCHAR(8)      NOT NULL,
    connection_status       VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    mt5_login_encrypted     VARCHAR(512),
    mt5_account_name        VARCHAR(200),
    mt5_company             VARCHAR(200),
    mt5_server              VARCHAR(200),
    mt5_currency            VARCHAR(10),
    mt5_balance             DECIMAL(18,2),
    mt5_equity              DECIMAL(18,2),
    last_heartbeat_at       TIMESTAMPTZ,
    last_sync_success_at    TIMESTAMPTZ,
    last_sync_error_at      TIMESTAMPTZ,
    last_error_message      TEXT,
    total_deals_imported    BIGINT          DEFAULT 0,
    total_trades_normalized BIGINT          DEFAULT 0,
    sync_checkpoint         TIMESTAMPTZ,
    token_created_at        TIMESTAMPTZ     NOT NULL,
    token_revoked_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_integrations_account FOREIGN KEY (trading_account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE,
    CONSTRAINT uk_integrations_account UNIQUE (trading_account_id)
);

CREATE INDEX IF NOT EXISTS idx_integrations_status ON mt5_integrations(connection_status);
CREATE INDEX IF NOT EXISTS idx_integrations_token_hash ON mt5_integrations(token_hash);

-- 4. Trade Strategies Table
CREATE TABLE IF NOT EXISTS trade_strategies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    description TEXT,
    rules       TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_strategies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_strategies_name UNIQUE (user_id, name)
);

-- 5. Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trading_account_id      BIGINT          NOT NULL,
    symbol                  VARCHAR(50),
    direction               VARCHAR(20)     NOT NULL,
    trade_source            VARCHAR(50)     NOT NULL DEFAULT 'MANUAL',
    trade_status            VARCHAR(50)     NOT NULL DEFAULT 'OPEN',
    entry_price             DECIMAL(18,8),
    exit_price              DECIMAL(18,8),
    total_volume            DECIMAL(18,8)   DEFAULT 0,
    closed_volume           DECIMAL(18,8)   DEFAULT 0,
    remaining_volume        DECIMAL(18,8)   DEFAULT 0,
    gross_pnl               DECIMAL(18,2),
    commission_total        DECIMAL(18,2)   DEFAULT 0,
    swap_total              DECIMAL(18,2)   DEFAULT 0,
    fee_total               DECIMAL(18,2)   DEFAULT 0,
    net_pnl                 DECIMAL(18,2),
    risk_amount             DECIMAL(18,2),
    r_multiple              DECIMAL(10,4),
    opened_at               TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    external_position_id    BIGINT,
    strategy_id             BIGINT,
    setup_name              VARCHAR(200),
    entry_reason            TEXT,
    exit_reason             TEXT,
    notes                   TEXT,
    emotion_before          VARCHAR(50),
    emotion_after           VARCHAR(50),
    followed_rules          BOOLEAN,
    mistakes                TEXT,
    post_trade_review       TEXT,
    rating                  SMALLINT        CHECK (rating BETWEEN 1 AND 5),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_trades_account FOREIGN KEY (trading_account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_trades_strategy FOREIGN KEY (strategy_id) REFERENCES trade_strategies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_opened ON trades(opened_at);
CREATE INDEX IF NOT EXISTS idx_trades_closed ON trades(closed_at);
CREATE INDEX IF NOT EXISTS idx_trades_source ON trades(trade_source);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(trade_status);
CREATE INDEX IF NOT EXISTS idx_trades_position ON trades(trading_account_id, external_position_id);

-- 6. MT5 Deals Table
CREATE TABLE IF NOT EXISTS mt5_deals (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id          BIGINT          NOT NULL,
    trade_id                BIGINT,
    external_deal_ticket    BIGINT          NOT NULL,
    external_position_id    BIGINT,
    external_order_ticket   BIGINT,
    symbol                  VARCHAR(50),
    deal_type               VARCHAR(50)     NOT NULL,
    entry_type              VARCHAR(20),
    volume                  DECIMAL(18,8)   NOT NULL DEFAULT 0,
    price                   DECIMAL(18,8)   NOT NULL DEFAULT 0,
    deal_time               TIMESTAMPTZ     NOT NULL,
    profit                  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    commission              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    swap                    DECIMAL(18,2)   NOT NULL DEFAULT 0,
    fee                     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    deal_reason             INT,
    magic_number            BIGINT,
    deal_comment            VARCHAR(500),
    source_platform         VARCHAR(20)     NOT NULL DEFAULT 'MT5',
    received_at             TIMESTAMPTZ     NOT NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_deals_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL,
    CONSTRAINT uk_deals_integration_ticket UNIQUE (integration_id, external_deal_ticket)
);

CREATE INDEX IF NOT EXISTS idx_deals_position ON mt5_deals(integration_id, external_position_id);
CREATE INDEX IF NOT EXISTS idx_deals_symbol ON mt5_deals(symbol);
CREATE INDEX IF NOT EXISTS idx_deals_time ON mt5_deals(deal_time);
CREATE INDEX IF NOT EXISTS idx_deals_trade ON mt5_deals(trade_id);

-- 7. Trade Tags Table
CREATE TABLE IF NOT EXISTS trade_tags (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trade_id    BIGINT          NOT NULL,
    tag_name    VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tags_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    CONSTRAINT uk_tags_trade_name UNIQUE (trade_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON trade_tags(tag_name);

-- 8. Trade Attachments Table
CREATE TABLE IF NOT EXISTS trade_attachments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trade_id        BIGINT          NOT NULL,
    file_name       VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    content_type    VARCHAR(100),
    file_size       BIGINT,
    attachment_type VARCHAR(50)     DEFAULT 'OTHER',
    caption         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_attachments_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_trade ON trade_attachments(trade_id);

-- 9. Sync Batches Table
CREATE TABLE IF NOT EXISTS sync_batches (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id      BIGINT          NOT NULL,
    batch_id            VARCHAR(36),
    records_received    INT             NOT NULL DEFAULT 0,
    records_inserted    INT             NOT NULL DEFAULT 0,
    records_duplicated  INT             NOT NULL DEFAULT 0,
    records_rejected    INT             NOT NULL DEFAULT 0,
    rejection_details   TEXT,
    checkpoint_before   TIMESTAMPTZ,
    checkpoint_after    TIMESTAMPTZ,
    http_status         INT,
    received_at         TIMESTAMPTZ     NOT NULL,
    processed_at        TIMESTAMPTZ,
    
    CONSTRAINT fk_batches_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_batches_integration ON sync_batches(integration_id);
CREATE INDEX IF NOT EXISTS idx_batches_received ON sync_batches(received_at);

-- 10. Import Jobs Table
CREATE TABLE IF NOT EXISTS import_jobs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id      BIGINT          NOT NULL,
    job_type            VARCHAR(50)     NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    import_from         TIMESTAMPTZ,
    import_to           TIMESTAMPTZ,
    total_batches       INT             DEFAULT 0,
    completed_batches   INT             DEFAULT 0,
    total_deals         INT             DEFAULT 0,
    imported_deals      INT             DEFAULT 0,
    error_message       TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_jobs_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_integration ON import_jobs(integration_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON import_jobs(status);
