# Trading Journal Platform — Architecture & Design Document

> **สถานะ:** Draft v1.0 — รอการอนุมัติก่อนเริ่ม implementation  
> **วันที่:** 2026-10-12  
> **Workspace:** `d:\tradeweb` (greenfield project)

---

## สารบัญ

1. [Product Requirements Document (PRD)](#1-product-requirements-document)
2. [Architecture Diagram](#2-architecture-diagram)
3. [MT5 Synchronization Data-Flow](#3-mt5-synchronization-data-flow)
4. [ER Diagram](#4-er-diagram)
5. [Database Schema](#5-database-schema)
6. [REST API Specification](#6-rest-api-specification)
7. [MT5 EA Synchronization Algorithm](#7-mt5-ea-synchronization-algorithm)
8. [Security Threat Model](#8-security-threat-model)
9. [Project Folder Structure](#9-project-folder-structure)
10. [Testing Strategy](#10-testing-strategy)
11. [Development Phases & Acceptance Criteria](#11-development-phases--acceptance-criteria)
12. [Local Setup & Deployment Plan](#12-local-setup--deployment-plan)
13. [Known MT5 Limitations & Decisions Requiring Approval](#13-known-mt5-limitations--decisions-requiring-approval)

---

## 1. Product Requirements Document

### 1.1 วิสัยทัศน์

Trading Journal Platform คือ web application สำหรับเทรดเดอร์ที่ต้องการบันทึก วิเคราะห์ และปรับปรุงผลการเทรดอย่างเป็นระบบ ระบบสามารถ sync ข้อมูลจาก MetaTrader 5 โดยอัตโนมัติผ่าน Expert Advisor (EA) ที่ทำงานบนเครื่องของผู้ใช้

### 1.2 กลุ่มผู้ใช้เป้าหมาย

| Persona | คำอธิบาย |
|---------|----------|
| **Retail Trader** | เทรดเดอร์รายย่อยที่ใช้ MT5 ต้องการ journal อัตโนมัติ |
| **Prop Firm Trader** | เทรดเดอร์ที่ต้อง track performance ตาม rule ของ prop firm |
| **Manual Trader** | เทรดเดอร์ที่ไม่ใช้ MT5 หรือต้องการบันทึกข้อมูลด้วยตนเอง |

### 1.3 Core Features (MVP)

| # | Feature | Priority |
|---|---------|----------|
| F1 | User Registration, Login, Logout (JWT) | P0 |
| F2 | Trading Account CRUD (manual + MT5) | P0 |
| F3 | MT5 Connection & Credential Management | P0 |
| F4 | MT5 EA Auto Sync (historical + incremental) | P0 |
| F5 | Deal Deduplication & Batch Processing | P0 |
| F6 | Deal → Logical Trade Aggregation | P0 |
| F7 | Trade History List & Detail View | P0 |
| F8 | Manual Journal Entries (notes, screenshots, emotions, mistakes) | P1 |
| F9 | Dashboard Analytics & Equity Curve | P1 |
| F10 | CSV Import (fallback) | P2 |
| F11 | MT5 Setup Guide (Thai) | P1 |

### 1.4 สิ่งที่ไม่อยู่ใน Scope

- Automated trading / order execution / signal generation
- การเก็บ broker password, investor password
- Billing / subscription / SaaS commercialization
- Mobile app (responsive web เท่านั้น)
- Multi-language i18n (Thai guide + English UI)

### 1.5 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | HTTPS in production, JWT with httpOnly cookies, bcrypt password hashing, rate limiting |
| **Data Integrity** | DB-level unique constraints, transactional batch processing, DECIMAL for financial values |
| **Responsive UI** | Mobile-First design: รองรับทุกขนาดหน้าจอ (Mobile 360px+, Tablet 768px+, Desktop 1024px+, Ultrawide 1440px+) |
| **Performance** | Dashboard loads < 2s for 10,000 trades, batch sync ≤ 500 records/request |
| **Reliability** | EA auto-retry with exponential backoff, missed-data recovery after disconnect |
| **Observability** | Structured logging (no secrets), health check endpoints, sync audit trail |

---

## 2. Architecture Diagram

```mermaid
graph TB
    subgraph "User's Machine"
        MT5["MetaTrader 5 Terminal"]
        EA["MQL5 Expert Advisor<br/>(TradingJournalSync.mq5)"]
        MT5 --> EA
    end

    subgraph "Cloud / Server"
        subgraph "Frontend - Vite + React"
            UI["React SPA<br/>TypeScript + Tailwind CSS"]
        end

        subgraph "Backend - Spring Boot"
            GW["API Gateway Layer<br/>/api/v1/*"]
            AUTH["Auth Module<br/>JWT + Spring Security"]
            ACCT["Account Service"]
            MT5SVC["MT5 Sync Service"]
            DEDUP["Deduplication Engine"]
            AGG["Trade Aggregation Engine"]
            JOURNAL["Journal Service"]
            ANALYTICS["Analytics Service"]
        end

        subgraph "Database"
            DB[(MySQL 8.0)]
            FW["Flyway Migrations"]
        end
    end

    EA -- "HTTPS POST<br/>Bearer Token<br/>JSON Batches" --> GW
    UI -- "HTTPS REST<br/>JWT Cookie" --> GW
    GW --> AUTH
    AUTH --> ACCT
    AUTH --> MT5SVC
    MT5SVC --> DEDUP
    DEDUP --> DB
    MT5SVC --> AGG
    AGG --> DB
    GW --> JOURNAL
    JOURNAL --> DB
    GW --> ANALYTICS
    ANALYTICS --> DB
    FW --> DB
```

### การตัดสินใจด้าน Architecture ที่สำคัญ

| การตัดสินใจ | เหตุผล |
|------------|--------|
| **EA push → Backend** (ไม่ใช่ Backend pull จาก MT5) | MT5 terminal ทำงานบนเครื่องผู้ใช้ ไม่มี public endpoint |
| **Two-tier auth: JWT cookie (UI) + Bearer token (EA)** | EA ไม่สามารถจัดการ cookie/session ได้ |
| **Raw deals + normalized trades แยกกัน** | เก็บ deals ต้นฉบับสำหรับ audit, สร้าง trades สำหรับ analytics |
| **Flyway สำหรับ migration** | Version control schema, reproducible across environments |
| **MySQL 8.0** | ตามที่กำหนด, รองรับ JSON, CTE, window functions |

---

## 3. MT5 Synchronization Data-Flow

```mermaid
sequenceDiagram
    participant MT5 as MT5 Terminal
    participant EA as Expert Advisor
    participant API as Spring Boot API
    participant DB as MySQL

    Note over EA: === Initial Historical Import ===
    EA->>MT5: HistorySelect(startDate, now)
    MT5-->>EA: Deal history loaded
    EA->>MT5: HistoryDealsTotal()
    MT5-->>EA: totalDeals count

    loop For each batch (max 200 deals)
        EA->>MT5: HistoryDealGetTicket(i) + GetInteger/Double/String
        EA->>EA: Build JSON batch payload
        EA->>API: POST /api/v1/mt5/sync/batches<br/>Authorization: Bearer {token}
        API->>API: Validate token + schema
        API->>DB: BEGIN TRANSACTION
        API->>DB: INSERT ON DUPLICATE KEY<br/>(integration_id, external_deal_ticket)
        API->>DB: COMMIT
        API-->>EA: 200 OK {inserted, duplicates, checkpoint}
        EA->>EA: Update local checkpoint
    end

    Note over EA: === Incremental Sync (Timer) ===
    loop Every SyncIntervalSeconds
        EA->>MT5: HistorySelect(checkpoint - overlap, now)
        MT5-->>EA: New/recent deals
        alt New deals found
            EA->>API: POST /api/v1/mt5/sync/batches
            API->>DB: Upsert with dedup
            API-->>EA: Ack with new checkpoint
        end
        EA->>API: POST /api/v1/mt5/sync/heartbeat
        API-->>EA: 200 OK
    end

    Note over EA: === Event-Driven Detection ===
    MT5->>EA: OnTradeTransaction(trans, request, result)
    alt trans.type == TRADE_TRANSACTION_DEAL_ADD
        EA->>EA: Set pendingSyncFlag = true
    end
    Note over EA: Next OnTimer() picks up flag

    Note over EA: === Error Recovery ===
    EA->>API: POST /api/v1/mt5/sync/batches
    API-->>EA: HTTP 500 / Timeout
    EA->>EA: Wait min(retryInterval * 2^n, 300s)
    EA->>API: Retry same batch
    API-->>EA: 200 OK
```

### Checkpoint Strategy

ใช้ **timestamp-based checkpoint with configurable overlap window**:

| Parameter | Default | คำอธิบาย |
|-----------|---------|----------|
| `lastSyncCheckpoint` | `0` (first run) | เวลา deal ล่าสุดที่ sync สำเร็จ |
| `overlapSeconds` | `300` (5 min) | ดึงย้อนหลังจาก checkpoint เพื่อดัก deal ที่มาช้า |
| `maxBatchSize` | `200` | deals สูงสุดต่อ batch |

**เหตุผลที่ใช้ overlap + dedup:** MT5 deal timestamps อาจ arrive out-of-order, overlap ง่ายและปลอดภัยกว่า compound cursor

---

## 4. ER Diagram

```mermaid
erDiagram
    users ||--o{ trading_accounts : "has many"
    trading_accounts ||--o| mt5_integrations : "has one optional"
    mt5_integrations ||--o{ mt5_deals : "receives"
    mt5_integrations ||--o{ sync_batches : "logs"
    mt5_integrations ||--o{ import_jobs : "triggers"
    trading_accounts ||--o{ trades : "contains"
    trades ||--o{ mt5_deals : "aggregates from"
    trades ||--o{ trade_tags : "tagged with"
    trades ||--o{ trade_attachments : "has"
    trades }o--o| trade_strategies : "uses"

    users {
        bigint id PK
        varchar email UK
        varchar username UK
        varchar password_hash
        varchar display_name
        varchar timezone
        timestamp created_at
        timestamp updated_at
    }

    trading_accounts {
        bigint id PK
        bigint user_id FK
        varchar account_name
        varchar broker
        varchar mt5_server
        enum account_type
        varchar currency
        decimal initial_balance
        enum status
        timestamp created_at
        timestamp updated_at
    }

    mt5_integrations {
        bigint id PK
        bigint trading_account_id FK_UK
        varchar token_hash
        varchar token_prefix
        enum connection_status
        varchar mt5_login_encrypted
        varchar mt5_account_name
        varchar mt5_company
        varchar mt5_server
        varchar mt5_currency
        decimal mt5_balance
        decimal mt5_equity
        timestamp last_heartbeat_at
        timestamp last_sync_success_at
        timestamp last_sync_error_at
        text last_error_message
        bigint total_deals_imported
        bigint total_trades_normalized
        timestamp sync_checkpoint
        timestamp token_created_at
        timestamp token_revoked_at
    }

    mt5_deals {
        bigint id PK
        bigint integration_id FK
        bigint trade_id FK
        bigint external_deal_ticket
        bigint external_position_id
        bigint external_order_ticket
        varchar symbol
        varchar deal_type
        varchar entry_type
        decimal volume
        decimal price
        timestamp deal_time
        decimal profit
        decimal commission
        decimal swap
        decimal fee
        int deal_reason
        bigint magic_number
        varchar deal_comment
    }

    trades {
        bigint id PK
        bigint trading_account_id FK
        varchar symbol
        enum direction
        enum trade_source
        enum trade_status
        decimal entry_price
        decimal exit_price
        decimal total_volume
        decimal closed_volume
        decimal remaining_volume
        decimal gross_pnl
        decimal commission_total
        decimal swap_total
        decimal fee_total
        decimal net_pnl
        timestamp opened_at
        timestamp closed_at
        bigint external_position_id
        bigint strategy_id FK
        text notes
        enum emotion_before
        enum emotion_after
        boolean followed_rules
        text mistakes
    }

    trade_strategies {
        bigint id PK
        bigint user_id FK
        varchar name
        text description
        text rules
    }

    trade_tags {
        bigint id PK
        bigint trade_id FK
        varchar tag_name
    }

    trade_attachments {
        bigint id PK
        bigint trade_id FK
        varchar file_name
        varchar file_path
        enum attachment_type
    }

    sync_batches {
        bigint id PK
        bigint integration_id FK
        varchar batch_id
        int records_received
        int records_inserted
        int records_duplicated
        int records_rejected
    }

    import_jobs {
        bigint id PK
        bigint integration_id FK
        enum job_type
        enum status
        timestamp import_from
        timestamp import_to
        int total_deals
        int imported_deals
    }
```

---

## 5. Database Schema

### 5.1 Flyway Naming: `V{version}__{description}.sql`

### V001 — Users

```sql
CREATE TABLE users (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    username        VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    display_name    VARCHAR(200),
    timezone        VARCHAR(50)     DEFAULT 'UTC',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email    UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V002 — Trading Accounts

```sql
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
```

### V003 — MT5 Integrations

```sql
CREATE TABLE mt5_integrations (
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
    trading_account_id      BIGINT          NOT NULL,
    token_hash              VARCHAR(64)     NOT NULL COMMENT 'SHA-256 hash of integration token',
    token_prefix            VARCHAR(8)      NOT NULL COMMENT 'First 8 chars for identification',
    connection_status       ENUM('NOT_CONNECTED','PENDING','CONNECTED','SYNCING','ERROR','DISCONNECTED')
                            NOT NULL DEFAULT 'PENDING',
    mt5_login_encrypted     VARCHAR(512)    COMMENT 'AES-256 encrypted MT5 login',
    mt5_account_name        VARCHAR(200),
    mt5_company             VARCHAR(200),
    mt5_server              VARCHAR(200),
    mt5_currency            VARCHAR(10),
    mt5_balance             DECIMAL(18,2),
    mt5_equity              DECIMAL(18,2),
    last_heartbeat_at       TIMESTAMP       NULL,
    last_sync_success_at    TIMESTAMP       NULL,
    last_sync_error_at      TIMESTAMP       NULL,
    last_error_message      TEXT,
    total_deals_imported    BIGINT          DEFAULT 0,
    total_trades_normalized BIGINT          DEFAULT 0,
    sync_checkpoint         TIMESTAMP       NULL,
    token_created_at        TIMESTAMP       NOT NULL,
    token_revoked_at        TIMESTAMP       NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_integrations_account FOREIGN KEY (trading_account_id) REFERENCES trading_accounts(id),
    CONSTRAINT uk_integrations_account UNIQUE (trading_account_id),
    INDEX idx_integrations_status (connection_status),
    INDEX idx_integrations_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V004 — Trade Strategies

```sql
CREATE TABLE trade_strategies (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    description TEXT,
    rules       TEXT,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_strategies_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_strategies_name UNIQUE (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V005 — Trades

```sql
CREATE TABLE trades (
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
    trading_account_id      BIGINT          NOT NULL,
    symbol                  VARCHAR(50),
    direction               ENUM('BUY','SELL') NOT NULL,
    trade_source            ENUM('MT5_SYNC','MANUAL','CSV_IMPORT') NOT NULL DEFAULT 'MANUAL',
    trade_status            ENUM('OPEN','CLOSED','PARTIALLY_CLOSED') NOT NULL DEFAULT 'OPEN',
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
    opened_at               TIMESTAMP       NULL,
    closed_at               TIMESTAMP       NULL,
    external_position_id    BIGINT          COMMENT 'MT5 position ID',
    strategy_id             BIGINT,
    setup_name              VARCHAR(200),
    entry_reason            TEXT,
    exit_reason             TEXT,
    notes                   TEXT,
    emotion_before          ENUM('CONFIDENT','NEUTRAL','ANXIOUS','FOMO','REVENGE','BORED','EXCITED'),
    emotion_after           ENUM('SATISFIED','NEUTRAL','FRUSTRATED','REGRETFUL','RELIEVED','ANGRY'),
    followed_rules          BOOLEAN,
    mistakes                TEXT,
    post_trade_review       TEXT,
    rating                  TINYINT         CHECK (rating BETWEEN 1 AND 5),
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trades_account FOREIGN KEY (trading_account_id) REFERENCES trading_accounts(id),
    CONSTRAINT fk_trades_strategy FOREIGN KEY (strategy_id) REFERENCES trade_strategies(id) ON DELETE SET NULL,
    INDEX idx_trades_account (trading_account_id),
    INDEX idx_trades_symbol (symbol),
    INDEX idx_trades_opened (opened_at),
    INDEX idx_trades_closed (closed_at),
    INDEX idx_trades_source (trade_source),
    INDEX idx_trades_status (trade_status),
    INDEX idx_trades_position (trading_account_id, external_position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V006 — MT5 Deals

```sql
CREATE TABLE mt5_deals (
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
    integration_id          BIGINT          NOT NULL,
    trade_id                BIGINT          NULL COMMENT 'Set after aggregation',
    external_deal_ticket    BIGINT          NOT NULL,
    external_position_id    BIGINT,
    external_order_ticket   BIGINT,
    symbol                  VARCHAR(50),
    deal_type               VARCHAR(50)     NOT NULL COMMENT 'MT5 ENUM_DEAL_TYPE as string',
    entry_type              VARCHAR(20)     COMMENT 'IN, OUT, INOUT, OUT_BY',
    volume                  DECIMAL(18,8)   NOT NULL DEFAULT 0,
    price                   DECIMAL(18,8)   NOT NULL DEFAULT 0,
    deal_time               TIMESTAMP       NOT NULL,
    profit                  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    commission              DECIMAL(18,2)   NOT NULL DEFAULT 0,
    swap                    DECIMAL(18,2)   NOT NULL DEFAULT 0,
    fee                     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    deal_reason             INT,
    magic_number            BIGINT,
    deal_comment            VARCHAR(500),
    source_platform         VARCHAR(20)     NOT NULL DEFAULT 'MT5',
    received_at             TIMESTAMP       NOT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_deals_integration FOREIGN KEY (integration_id) REFERENCES mt5_integrations(id),
    CONSTRAINT fk_deals_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL,
    CONSTRAINT uk_deals_integration_ticket UNIQUE (integration_id, external_deal_ticket),
    INDEX idx_deals_position (integration_id, external_position_id),
    INDEX idx_deals_symbol (symbol),
    INDEX idx_deals_time (deal_time),
    INDEX idx_deals_trade (trade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V007 — Trade Tags

```sql
CREATE TABLE trade_tags (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    trade_id    BIGINT          NOT NULL,
    tag_name    VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tags_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    CONSTRAINT uk_tags_trade_name UNIQUE (trade_id, tag_name),
    INDEX idx_tags_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### V008 — Trade Attachments

```sql
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
```

### V009 — Sync Batches

```sql
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
```

### V010 — Import Jobs

```sql
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
```

### Timezone Strategy

- **MySQL:** ทุก TIMESTAMP เก็บใน UTC
- **MT5 EA:** แปลง deal_time เป็น Unix timestamp (UTC) ก่อนส่ง
- **Spring Boot:** `hibernate.jdbc.time_zone=UTC`
- **Frontend:** แสดงตาม timezone ที่ user ตั้งค่า

### Deletion & Disconnection Behavior

| Action | ผลลัพธ์ |
|--------|---------|
| **Disconnect** | status → DISCONNECTED, revoke token, **ไม่ลบ** deals/trades |
| **Reconnect** | token ใหม่, status → PENDING |
| **Archive account** | status → ARCHIVED, ข้อมูลยังอยู่ |
| **Delete account** | Soft delete เท่านั้นใน MVP |

---

## 6. REST API Specification

### 6.1 Endpoint Overview

Base URL: `/api/v1`

| Group | Endpoint | Method | Auth | Description |
|-------|----------|--------|------|-------------|
| **Auth** | `/auth/register` | POST | Public | ลงทะเบียน |
| | `/auth/login` | POST | Public | เข้าสู่ระบบ |
| | `/auth/logout` | POST | JWT | ออกจากระบบ |
| | `/auth/me` | GET | JWT | ผู้ใช้ปัจจุบัน |
| **Accounts** | `/accounts` | GET | JWT | รายการ accounts |
| | `/accounts` | POST | JWT | สร้าง account |
| | `/accounts/{id}` | GET/PUT/DELETE | JWT | CRUD |
| **MT5 Connections** | `/mt5/connections` | POST | JWT | สร้าง connection |
| | `/mt5/connections` | GET | JWT | รายการ |
| | `/mt5/connections/{id}` | GET | JWT | รายละเอียด |
| | `/mt5/connections/{id}/credentials/rotate` | POST | JWT | สร้าง token ใหม่ |
| | `/mt5/connections/{id}/disconnect` | POST | JWT | ตัดการเชื่อมต่อ |
| | `/mt5/connections/{id}/reconnect` | POST | JWT | เชื่อมต่อใหม่ |
| | `/mt5/connections/{id}/resync` | POST | JWT | สั่ง resync |
| | `/mt5/connections/{id}/status` | GET | JWT | สถานะ |
| **Sync (EA)** | `/mt5/sync/batches` | POST | EA Token | ส่ง deal batch |
| | `/mt5/sync/heartbeat` | POST | EA Token | heartbeat |
| | `/mt5/sync/account-info` | POST | EA Token | อัพเดตข้อมูล account |
| **Trades** | `/trades` | GET | JWT | รายการ trades |
| | `/trades/{id}` | GET | JWT | รายละเอียด trade |
| | `/trades` | POST | JWT | สร้าง manual trade |
| | `/trades/{id}` | PUT | JWT | แก้ไข journal |
| | `/trades/{id}/tags` | PUT | JWT | จัดการ tags |
| | `/trades/{id}/attachments` | POST | JWT | อัพโหลด |
| **Strategies** | `/strategies` | GET/POST | JWT | CRUD |
| **Analytics** | `/analytics/summary` | GET | JWT | สรุป performance |
| | `/analytics/equity-curve` | GET | JWT | equity curve |
| | `/analytics/daily-pnl` | GET | JWT | P&L รายวัน |
| | `/analytics/by-symbol` | GET | JWT | ตาม symbol |
| | `/analytics/by-strategy` | GET | JWT | ตาม strategy |

### 6.2 Batch Sync — Request Example

```json
{
  "apiVersion": "1.0",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "importJobId": null,
  "accountInfo": {
    "login": 12345678,
    "name": "John Doe",
    "company": "ICMarkets-Demo",
    "server": "ICMarketsSC-Demo",
    "currency": "USD",
    "balance": 10250.50,
    "equity": 10340.20
  },
  "checkpoint": "2026-10-01T00:00:00Z",
  "deals": [
    {
      "ticket": 987654321,
      "positionId": 111222333,
      "orderTicket": 444555666,
      "symbol": "EURUSD",
      "dealType": "BUY",
      "entryType": "IN",
      "volume": 0.10,
      "price": 1.08550,
      "dealTime": "2026-10-10T14:30:15Z",
      "profit": 0.0,
      "commission": -0.70,
      "swap": 0.0,
      "fee": 0.0,
      "reason": 0,
      "magicNumber": 0,
      "comment": ""
    },
    {
      "ticket": 987654322,
      "positionId": 111222333,
      "orderTicket": 444555667,
      "symbol": "EURUSD",
      "dealType": "SELL",
      "entryType": "OUT",
      "volume": 0.10,
      "price": 1.08720,
      "dealTime": "2026-10-10T15:45:30Z",
      "profit": 17.00,
      "commission": -0.70,
      "swap": 0.0,
      "fee": 0.0,
      "reason": 3,
      "magicNumber": 0,
      "comment": "TP hit"
    }
  ]
}
```

### 6.3 Batch Sync — Response Example (Success)

```json
{
  "apiVersion": "1.0",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSED",
  "summary": {
    "received": 2,
    "inserted": 2,
    "duplicates": 0,
    "updated": 0,
    "rejected": 0
  },
  "rejections": [],
  "newCheckpoint": "2026-10-10T15:45:30Z",
  "retryable": false
}
```

### 6.4 Batch Sync — Response Example (Partial Failure)

```json
{
  "apiVersion": "1.0",
  "batchId": "...",
  "status": "PARTIAL",
  "summary": {
    "received": 5,
    "inserted": 3,
    "duplicates": 1,
    "updated": 0,
    "rejected": 1
  },
  "rejections": [
    {
      "ticket": 999000111,
      "reason": "VALIDATION_ERROR",
      "message": "volume must be > 0",
      "retryable": false
    }
  ],
  "newCheckpoint": "2026-10-10T16:00:00Z",
  "retryable": false
}
```

### 6.5 Batch Policy

**Partial Success:** insert valid deals, reject invalid ones independently — EA ไม่ต้อง retry ทั้ง batch

### 6.6 EA Authentication

```
Authorization: Bearer tj_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

- Prefix: `tj_` (trading journal), 40+ chars, `SecureRandom`
- Backend เก็บเฉพาะ SHA-256 hash
- Lookup by hash → verify `token_revoked_at IS NULL` → verify integration active

### 6.7 Rate Limits & Payload Limits

| Setting | Value |
|---------|-------|
| Auth endpoints | 10 req/min per IP |
| Sync batches | 60 req/min per token |
| Heartbeat | 20 req/min per token |
| General API | 120 req/min per user |
| Max deals/batch | 500 |
| Max body size | 2 MB |
| Max attachment | 10 MB |

---

## 7. MT5 EA Synchronization Algorithm

### 7.1 EA Input Parameters

```mql5
input string   BackendApiUrl         = "https://your-domain.com/api/v1";
input string   IntegrationToken      = "";
input int      SyncIntervalSeconds   = 30;
input int      InitialImportDays     = 30;
input int      MaxRecordsPerBatch    = 200;
input int      OverlapSeconds        = 300;
input int      RetryIntervalSeconds  = 10;
input int      MaxRetryAttempts      = 10;
input int      HttpTimeoutMs         = 15000;
input bool     EnableSync            = true;
input bool     DebugLogging          = false;
```

### 7.2 Core Algorithm (Pseudocode)

```
OnInit():
    1. Validate inputs (URL, token not empty)
    2. EventSetTimer(SyncIntervalSeconds)
    3. Load lastSyncCheckpoint from GlobalVariableGet("TJ_CHECKPOINT_" + AccountLogin)
    4. If checkpoint == 0:
        → initialImportMode = true
        → checkpoint = TimeCurrent() - InitialImportDays * 86400
    5. pendingSyncFlag = true
    6. Send heartbeat
    7. Return INIT_SUCCEEDED

OnTradeTransaction(trans, request, result):
    1. If trans.type == TRADE_TRANSACTION_DEAL_ADD:
        → pendingSyncFlag = true
        → Log "New deal detected"
    2. NO network I/O here
    3. NO history scan here

OnTimer():
    1. If !EnableSync → return
    2. If pendingSyncFlag OR timer:
        → PerformIncrementalSync()
        → Heartbeat every 5 cycles

PerformIncrementalSync():
    1. queryFrom = checkpoint - OverlapSeconds
    2. queryTo = TimeCurrent()
    3. HistorySelect(queryFrom, queryTo)
    4. totalDeals = HistoryDealsTotal()
    5. If 0 → clear flag, return
    6. Read deals via HistoryDealGetTicket(i) + property getters
    7. Split into batches of MaxRecordsPerBatch
    8. For each batch:
        a. Build JSON with batchId (UUID), deals[]
        b. SendBatch(json)
        c. Success → update checkpoint from response, save GlobalVariable, reset retryCount
        d. Failure → increment retryCount, backoff wait, return

SendBatch(json):
    1. headers = "Content-Type: application/json\r\nAuthorization: Bearer " + token + "\r\n"
    2. StringToCharArray(json, postData)
    3. WebRequest("POST", url + "/mt5/sync/batches", headers, timeout, postData, result, resHeaders)
    4. Parse response, return status

OnDeinit(reason):
    1. GlobalVariableSet(checkpoint key, lastSyncCheckpoint)
    2. EventKillTimer()
```

### 7.3 Recovery After Restart

1. `OnInit()` → read checkpoint from `GlobalVariableGet()`
2. ถ้ามี checkpoint → ดึง deals ตั้งแต่ (checkpoint - overlap)
3. ถ้าไม่มี → first-time setup, import `InitialImportDays`
4. Backend dedup ป้องกัน duplicate records

### 7.4 Verified MQL5 APIs

| Function | Purpose |
|----------|---------|
| `HistorySelect(from, to)` | Load deal history into cache |
| `HistoryDealsTotal()` | Count deals in cache |
| `HistoryDealGetTicket(index)` | Get deal ticket by index |
| `HistoryDealGetInteger(ticket, prop)` | `DEAL_TICKET`, `DEAL_POSITION_ID`, `DEAL_TYPE`, `DEAL_ENTRY`, `DEAL_REASON`, `DEAL_MAGIC`, `DEAL_TIME` |
| `HistoryDealGetDouble(ticket, prop)` | `DEAL_VOLUME`, `DEAL_PRICE`, `DEAL_PROFIT`, `DEAL_COMMISSION`, `DEAL_SWAP`, `DEAL_FEE` |
| `HistoryDealGetString(ticket, prop)` | `DEAL_SYMBOL`, `DEAL_COMMENT` |
| `OnTradeTransaction(trans, request, result)` | Trade activity callback |
| `WebRequest(method, url, headers, timeout, data[], result[], headers)` | HTTP request (synchronous) |
| `GlobalVariableSet/Get(name, value)` | Persistent storage across restarts |
| `AccountInfoInteger/String/Double(prop)` | Account metadata |

---

## 8. Security Threat Model

### 8.1 Threats & Mitigations

| # | Threat | Impact | Mitigation |
|---|--------|--------|------------|
| T1 | **Token leaked** (compromised machine) | Fake deals sent | Immediate revocation via UI; scoped to 1 integration; hash-only storage |
| T2 | **EA spoofs account ownership** | Cross-account access | Token scoped to specific integration_id only |
| T3 | **Replay attack** | Duplicate deals | Idempotent INSERT ON DUPLICATE KEY; batchId audit trail |
| T4 | **DoS via oversized batches** | Server exhaustion | 500 deals/batch, 2MB limit, rate limiting |
| T5 | **SQL injection via comment** | DB compromise | Parameterized queries via JPA |
| T6 | **JWT theft (XSS)** | Account takeover | httpOnly + Secure + SameSite cookies; CSP headers |
| T7 | **CSRF** | Unauthorized changes | SameSite cookie + CSRF token |
| T8 | **Cross-user data access** | Privacy breach | Every query joins on user_id; ownership check in service |
| T9 | **MT5 login exposed in logs** | Sensitive data leak | AES-encrypted storage; masked in API responses |
| T10 | **Stale revoked token still accepted** | Unauthorized sync | Token hash lookup verifies revoked_at IS NULL on every request |

### 8.2 Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: POST /mt5/connections
    Created --> Active: Token shown once
    Active --> Active: EA uses for sync
    Active --> Revoked: rotate or disconnect
    Revoked --> [*]: Hash kept for audit
    Revoked --> NewToken: rotate or reconnect
    NewToken --> Active: New token shown once
```

### 8.3 Local Security Warning

**Integration token ถูกเก็บเป็น plaintext ใน EA input parameters บนเครื่องผู้ใช้** — MQL5 ไม่มี secure storage

**ความเสี่ยง:** มัลแวร์อาจอ่าน token ได้ → ส่ง deals ปลอม

**การป้องกัน:**
1. Token scope จำกัด — sync data เท่านั้น ไม่เข้าถึง profile/account อื่น
2. Revoke ทันทีผ่าน web UI
3. Rotate เป็นระยะ
4. ถ้าเครื่องถูก compromise → revoke → rotate → ตรวจสอบ deals

---

## 9. Project Folder Structure

### Root

```
d:\tradeweb\
├── backend/                    # Spring Boot
├── frontend/                   # React + Vite
├── mt5/                        # MQL5 EA
├── docs/                       # Documentation
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### Backend

```
backend/
├── pom.xml
├── src/main/java/com/tradeweb/
│   ├── TradingJournalApplication.java
│   ├── config/          (Security, JWT, CORS, RateLimit)
│   ├── auth/            (AuthController, AuthService, JwtService, Filter)
│   ├── user/            (User entity, repo, service, controller)
│   ├── account/         (TradingAccount entity, repo, service, controller)
│   ├── mt5/             (Integration, Deal, SyncBatch, ImportJob entities + services + controllers + EaTokenFilter)
│   ├── trade/           (Trade, Tag, Attachment, Strategy entities + AggregationService + services + controllers)
│   ├── analytics/       (AnalyticsService, AnalyticsController)
│   ├── common/          (GlobalExceptionHandler, DTOs, SecurityUtils)
│   └── health/          (HealthController)
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/   (V001 through V010)
└── src/test/java/com/tradeweb/  (unit + integration tests)
```

### Frontend

```
frontend/
├── package.json, vite.config.ts, tailwind.config.ts, tsconfig.json
├── src/
│   ├── main.tsx, App.tsx
│   ├── api/        (client, auth, accounts, mt5, trades, analytics, types)
│   ├── hooks/      (useAuth, useTrades, useAccounts, useMt5Connections, useAnalytics)
│   ├── components/
│   │   ├── layout/ (Sidebar, Header, Layout, ProtectedRoute)
│   │   ├── ui/     (Button, Card, Input, Table, Modal, Badge, etc.)
│   │   ├── charts/ (EquityCurve, PnlBarChart, WinRateDonut, etc.)
│   │   ├── trades/ (TradeTable, TradeDetail, TradeForm, TradeFilters)
│   │   ├── mt5/    (ConnectionCard, ConnectionStatus, SetupGuide)
│   │   └── analytics/ (SummaryCards, DailyPnl, PerformanceTable)
│   ├── pages/      (Login, Register, Dashboard, Trades, TradeDetail, Accounts, Mt5Connections, Analytics, Settings)
│   ├── stores/     (authStore)
│   ├── utils/      (formatters, calculations, validators)
│   └── styles/     (index.css)
```

### MT5

```
mt5/
├── Experts/TradingJournalSync.mq5
├── Include/
│   ├── TJSyncConfig.mqh
│   ├── TJHttpClient.mqh
│   ├── TJDealCollector.mqh
│   ├── TJJsonBuilder.mqh
│   └── TJLogger.mqh
└── README_TH.md
```

---

## 10. Testing Strategy

### 10.1 Backend Tests

**Unit Tests (JUnit 5 + Mockito) — ~80+ tests:**

| Area | Test Cases |
|------|------------|
| Mt5SyncService | Valid batch, empty batch, oversized, invalid fields, null optionals |
| Deduplication | Same ticket → no dup, concurrent requests |
| TradeAggregation | Single deal, multi-entry, partial close, reversal, balance excluded, volume calc, fee allocation |
| AnalyticsService | Win rate, profit factor, expectancy, drawdown, div-by-zero, empty data |
| JwtService | Generation, validation, expiration, invalid signature |
| Mt5TokenService | Generation, hashing, verification, revocation |

**Integration Tests (Spring Boot Test + TestContainers) — ~40 tests:**

| Area | Test Cases |
|------|------------|
| Auth flow | Register → login → access → logout |
| Batch endpoint | Submit → verify DB → submit dup → verify dedup |
| Ownership | User A ≠ User B isolation |
| Token revocation | Revoke → immediate rejection |
| Concurrent sync | Two batches → no dups |

### 10.2 Trade Aggregation Test Scenarios

```
Scenario 1: Simple BUY → SELL (1 position, 2 deals)
  Deal 1: BUY IN  0.10 @ 1.08550, profit=0, commission=-0.70
  Deal 2: SELL OUT 0.10 @ 1.08720, profit=17.00, commission=-0.70
  Expected: CLOSED, entry=1.08550, exit=1.08720, gross=17.00, commission=-1.40, net=15.60

Scenario 2: Partial Close (3 deals)
  Deal 1: BUY IN  0.50 @ 1.08500
  Deal 2: SELL OUT 0.20 @ 1.08700, profit=40.00
  Deal 3: SELL OUT 0.10 @ 1.08600, profit=10.00
  Expected: PARTIALLY_CLOSED, closed=0.30, remaining=0.20, realized gross=50.00

Scenario 3: Scaling In (multiple entries)
  Deal 1: BUY IN 0.10 @ 1.08500
  Deal 2: BUY IN 0.20 @ 1.08600
  Deal 3: SELL OUT 0.30 @ 1.08800
  Expected: CLOSED, entry=(0.10*1.085+0.20*1.086)/0.30=1.08567

Scenario 4: Balance/Credit
  Deal: BALANCE type, profit=5000.00
  Expected: NOT a trade

Scenario 5: Position Reversal (INOUT)
  Deal 1: BUY IN 0.10 @ 1.08500
  Deal 2: SELL INOUT 0.20 @ 1.08700
  Expected: Close BUY 0.10 + Open SELL 0.10
```

### 10.3 Frontend Tests

| Type | Tool |
|------|------|
| Component rendering | Vitest + React Testing Library |
| Form validation | Vitest + Zod |
| API mocking | MSW |

### 10.4 EA Testing

| Method | What |
|--------|------|
| Mock HTTP server | Response codes, timeouts |
| MT5 Strategy Tester | History collection |
| Manual checklist | Restart recovery, network disconnect |

### 10.5 Critical Invariants

1. `(integration_id, external_deal_ticket)` always unique
2. `SUM(closed_volume)` ≤ trade's `total_volume`
3. `net_pnl = gross_pnl + commission + swap + fee`
4. User A cannot see User B's data
5. Revoked token rejected immediately

---

## 11. Development Phases & Acceptance Criteria

### Phase 1 — Architecture & Foundation (Week 1)

| Deliverable | Acceptance |
|-------------|-----------|
| Repo structure | backend/, frontend/, mt5/, docs/ created |
| Docker Compose | `docker-compose up` → MySQL ready |
| Spring Boot skeleton | `/api/v1/health` → `{"status":"UP"}` |
| Flyway migrations | All tables created on boot |
| React skeleton | Vite dev server + Tailwind + Router |
| Error handling | Consistent JSON error responses |

### Phase 2 — Authentication & Accounts (Week 2)

| Deliverable | Acceptance |
|-------------|-----------|
| Registration/Login | JWT in httpOnly cookie |
| Logout | Cookie cleared |
| Protected routes | 401 for unauthenticated |
| Account CRUD | Create, read, update, archive |
| Ownership | 403 cross-user access |
| Frontend | Login, register, account pages |
| Tests | Auth unit + integration passing |

### Phase 3 — MT5 Auto Sync MVP (Weeks 3-4)

| Deliverable | Acceptance |
|-------------|-----------|
| Connection CRUD | Create, list, view, disconnect, reconnect |
| Token management | Generate (show once), rotate, revoke |
| EA Token auth | Bearer token filter, scoped |
| Batch endpoint | Deals persisted with dedup |
| Heartbeat | Status updated |
| MQL5 EA | Compileable, historical import, incremental sync |
| Deduplication | Duplicate batch → 0 new inserts |
| Connection status | Real timestamps in UI |
| Recovery | Restart → resume from checkpoint |
| Tests | Dedup, validation, revocation, ownership |

### Phase 4 — Trade Normalization & Journal (Week 5)

| Deliverable | Acceptance |
|-------------|-----------|
| Aggregation | Deals → trades with correct P&L |
| Partial close | PARTIALLY_CLOSED + realized P&L |
| Balance filtering | Non-trading excluded |
| Trade history page | Table + filters + pagination |
| Trade detail | Deals + journal fields |
| Journal entry | Notes, emotions, mistakes, rating |
| Screenshots | Upload before/after |
| Manual trade | Create without MT5 |
| Tests | All 5 aggregation scenarios |

### Phase 5 — Dashboard & Analytics (Week 6)

| Deliverable | Acceptance |
|-------------|-----------|
| Summary cards | P&L, win rate, profit factor, expectancy |
| Equity curve | Recharts line chart |
| Daily/Monthly P&L | Bar chart |
| Performance by symbol/strategy | Tables + charts |
| Filters | Account, date, symbol, strategy |
| Empty states | Graceful |
| Div-by-zero safety | No crashes |
| Tests | Deterministic analytics tests |

### Phase 6 — Import, Hardening, Deployment (Week 7)

| Deliverable | Acceptance |
|-------------|-----------|
| CSV Import | Upload → trades created |
| MT5 Guide (Thai) | Complete at /mt5-guide |
| Security review | Rate limiting, CORS, no secrets in logs |
| Docker production | Multi-stage build |
| Deployment guide | Step-by-step |
| Backup guide | mysqldump + restore |

---

## 12. Local Setup & Deployment Plan

### 12.1 docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: tradeweb-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-devroot}
      MYSQL_DATABASE: tradeweb
      MYSQL_USER: ${MYSQL_USER:-tradeweb}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-tradeweb_dev}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

### 12.2 Quick Start

```bash
# 1. MySQL
docker-compose up -d mysql

# 2. Backend
cd backend && cp .env.example .env && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Frontend
cd frontend && npm install && npm run dev

# 4. EA → copy to MT5 data folder → compile → attach to chart
```

### 12.3 Environment Variables

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=tradeweb
MYSQL_USER=tradeweb
MYSQL_PASSWORD=<secure>
JWT_SECRET=<64-char-random>
JWT_EXPIRATION_MS=86400000
TOKEN_ENCRYPTION_KEY=<32-byte-base64>
MT5_LOGIN_ENCRYPTION_KEY=<32-byte-base64>
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
```

### 12.4 Production Architecture

```mermaid
graph LR
    User["Browser"] -- "HTTPS :443" --> NGINX
    EA["MT5 EA"] -- "HTTPS :443" --> NGINX
    NGINX -- ":8080" --> SB["Spring Boot"]
    NGINX -- "static" --> REACT["Built React"]
    SB --> DB["MySQL 8.0"]
    CRON["Backup"] -- "mysqldump" --> DB
```

### 12.5 Production Checklist

- [ ] HTTPS certificate (Let's Encrypt)
- [ ] All secrets in env vars
- [ ] Rate limiting enabled
- [ ] CORS restricted to prod domain
- [ ] MySQL NOT exposed to internet
- [ ] Daily mysqldump backups
- [ ] Log rotation
- [ ] Health check monitoring
- [ ] Firewall: only 443 open

---

## 13. Known MT5 Limitations & Decisions Requiring Approval

### 13.1 MT5 Limitations

| # | Limitation | Impact | Mitigation |
|---|-----------|--------|------------|
| L1 | `WebRequest` is synchronous | EA freezes during HTTP | 15s timeout, timer-based sync |
| L2 | `WebRequest` doesn't work in indicators | Must use EA | EA only |
| L3 | URL must be whitelisted in MT5 settings | Manual config | Step-by-step guide |
| L4 | No secure storage for EA inputs | Token in plaintext | Scoped + revocable |
| L5 | Server may trim old history | Missing data | 30-day default, warn user |
| L6 | `OnTradeTransaction` not exactly-once | May miss/duplicate | Timer polling as primary |
| L7 | Netting vs Hedging semantics differ | Position ID handling | Hedging first in MVP |
| L8 | `DEAL_FEE` may be missing in old builds | Missing field | Default 0.0 |
| L9 | No standard JSON library in MQL5 | Manual JSON building | Custom `TJJsonBuilder.mqh` |

### 13.2 Decisions Requiring Approval

| # | Decision | Default | Alternative | เหตุผล |
|---|----------|---------|-------------|--------|
| D1 | JWT storage | **httpOnly cookie** | localStorage | ปลอดภัยกว่า XSS |
| D2 | Batch failure policy | **Partial success** | All-or-nothing | EA recovery ง่ายกว่า |
| D3 | Deal update policy | **Insert-only** (immutable) | Allow update | Audit log integrity |
| D4 | Password hashing | **bcrypt (cost 12)** | Argon2id | Spring Security default |
| D5 | Account mode | **Hedging first** | Both from start | Hedging simpler, most brokers |
| D6 | Frontend state | **TanStack Query + Zustand** | Redux | Better server state mgmt |
| D7 | File storage | **Local filesystem** | Cloud Storage | Simple start, migrate later |
| D8 | Aggregation timing | **On-demand** (immediate) | Background queue | Simpler architecture |
| D9 | API versioning | **URL path** (/api/v1/) | Header-based | Clear, debuggable |
| D10 | Soft delete | **Status field** | deleted_at column | Matches business logic |

### 13.3 Trade Aggregation Formulas (ต้อง Approval)

| Metric | Formula |
|--------|---------|
| Avg Entry Price | `Σ(entry_price × volume) / Σ(entry_volume)` |
| Avg Exit Price | `Σ(exit_price × volume) / Σ(exit_volume)` |
| Gross P&L | `Σ(deal.profit)` for OUT/INOUT deals |
| Commission | `Σ(deal.commission)` for all deals |
| Swap | `Σ(deal.swap)` for all deals |
| Fee | `Σ(deal.fee)` for all deals |
| Net P&L | `gross_pnl + commission + swap + fee` |
| Win Rate | `wins / closed_trades × 100` |
| Profit Factor | `Σ(wins) / abs(Σ(losses))` — ∞ if no losses |
| Expectancy | `(win_rate × avg_win) - (loss_rate × avg_loss)` |
| R-Multiple | `net_pnl / risk_amount` (if provided) |
| Max Drawdown | Peak-to-trough in cumulative equity |
| Break-even | `abs(net_pnl) < 0.005` |

---

## Technology Versions

| Technology | Version | เหตุผล |
|-----------|---------|--------|
| Java | 21 LTS | Latest LTS, virtual threads |
| Spring Boot | 3.3.x | Latest stable |
| Spring Security | 6.x | Bundled with Boot 3.3 |
| MySQL | 8.0 | Stable, JSON, CTEs |
| Flyway | 10.x | Compatible with Boot 3.3 |
| Node.js | 20 LTS | Required by Vite |
| React | 18.x | Latest stable |
| TypeScript | 5.x | Latest |
| Vite | 5.x | Fast HMR |
| Tailwind CSS | 3.x | User-specified |
| TanStack Query | 5.x | Server state |
| Recharts | 2.x | Charting |
| Zod | 3.x | Validation |

---

> **Next Steps:** เมื่อ approve ทั้ง 10 decisions (D1-D10) และ formulas แล้ว จะเริ่ม Phase 1 ทันที
