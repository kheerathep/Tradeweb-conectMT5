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
