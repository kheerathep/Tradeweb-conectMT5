package com.tradeweb.mt5.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "mt5_integrations")
public class Mt5Integration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trading_account_id", nullable = false, unique = true)
    private Long tradingAccountId;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "token_prefix", nullable = false, length = 8)
    private String tokenPrefix;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", nullable = false)
    private ConnectionStatus connectionStatus = ConnectionStatus.PENDING;

    @Column(name = "mt5_login_encrypted", length = 512)
    private String mt5LoginEncrypted;

    @Column(name = "mt5_account_name")
    private String mt5AccountName;

    @Column(name = "mt5_company")
    private String mt5Company;

    @Column(name = "mt5_server")
    private String mt5Server;

    @Column(name = "mt5_currency", length = 10)
    private String mt5Currency;

    @Column(name = "mt5_balance", precision = 18, scale = 2)
    private BigDecimal mt5Balance;

    @Column(name = "mt5_equity", precision = 18, scale = 2)
    private BigDecimal mt5Equity;

    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;

    @Column(name = "last_sync_success_at")
    private Instant lastSyncSuccessAt;

    @Column(name = "last_sync_error_at")
    private Instant lastSyncErrorAt;

    @Column(name = "last_error_message", columnDefinition = "TEXT")
    private String lastErrorMessage;

    @Column(name = "total_deals_imported")
    private Long totalDealsImported = 0L;

    @Column(name = "total_trades_normalized")
    private Long totalTradesNormalized = 0L;

    @Column(name = "sync_checkpoint")
    private Instant syncCheckpoint;

    @Column(name = "token_created_at", nullable = false)
    private Instant tokenCreatedAt = Instant.now();

    @Column(name = "token_revoked_at")
    private Instant tokenRevokedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Mt5Integration() {}

    public Mt5Integration(Long tradingAccountId, String tokenHash, String tokenPrefix) {
        this.tradingAccountId = tradingAccountId;
        this.tokenHash = tokenHash;
        this.tokenPrefix = tokenPrefix;
        this.connectionStatus = ConnectionStatus.PENDING;
        this.tokenCreatedAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isTokenActive() {
        return this.tokenRevokedAt == null && this.connectionStatus != ConnectionStatus.DISCONNECTED;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTradingAccountId() {
        return tradingAccountId;
    }

    public void setTradingAccountId(Long tradingAccountId) {
        this.tradingAccountId = tradingAccountId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getTokenPrefix() {
        return tokenPrefix;
    }

    public void setTokenPrefix(String tokenPrefix) {
        this.tokenPrefix = tokenPrefix;
    }

    public ConnectionStatus getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(ConnectionStatus connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public String getMt5LoginEncrypted() {
        return mt5LoginEncrypted;
    }

    public void setMt5LoginEncrypted(String mt5LoginEncrypted) {
        this.mt5LoginEncrypted = mt5LoginEncrypted;
    }

    public String getMt5AccountName() {
        return mt5AccountName;
    }

    public void setMt5AccountName(String mt5AccountName) {
        this.mt5AccountName = mt5AccountName;
    }

    public String getMt5Company() {
        return mt5Company;
    }

    public void setMt5Company(String mt5Company) {
        this.mt5Company = mt5Company;
    }

    public String getMt5Server() {
        return mt5Server;
    }

    public void setMt5Server(String mt5Server) {
        this.mt5Server = mt5Server;
    }

    public String getMt5Currency() {
        return mt5Currency;
    }

    public void setMt5Currency(String mt5Currency) {
        this.mt5Currency = mt5Currency;
    }

    public BigDecimal getMt5Balance() {
        return mt5Balance;
    }

    public void setMt5Balance(BigDecimal mt5Balance) {
        this.mt5Balance = mt5Balance;
    }

    public BigDecimal getMt5Equity() {
        return mt5Equity;
    }

    public void setMt5Equity(BigDecimal mt5Equity) {
        this.mt5Equity = mt5Equity;
    }

    public Instant getLastHeartbeatAt() {
        return lastHeartbeatAt;
    }

    public void setLastHeartbeatAt(Instant lastHeartbeatAt) {
        this.lastHeartbeatAt = lastHeartbeatAt;
    }

    public Instant getLastSyncSuccessAt() {
        return lastSyncSuccessAt;
    }

    public void setLastSyncSuccessAt(Instant lastSyncSuccessAt) {
        this.lastSyncSuccessAt = lastSyncSuccessAt;
    }

    public Instant getLastSyncErrorAt() {
        return lastSyncErrorAt;
    }

    public void setLastSyncErrorAt(Instant lastSyncErrorAt) {
        this.lastSyncErrorAt = lastSyncErrorAt;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public void setLastErrorMessage(String lastErrorMessage) {
        this.lastErrorMessage = lastErrorMessage;
    }

    public Long getTotalDealsImported() {
        return totalDealsImported;
    }

    public void setTotalDealsImported(Long totalDealsImported) {
        this.totalDealsImported = totalDealsImported;
    }

    public Long getTotalTradesNormalized() {
        return totalTradesNormalized;
    }

    public void setTotalTradesNormalized(Long totalTradesNormalized) {
        this.totalTradesNormalized = totalTradesNormalized;
    }

    public Instant getSyncCheckpoint() {
        return syncCheckpoint;
    }

    public void setSyncCheckpoint(Instant syncCheckpoint) {
        this.syncCheckpoint = syncCheckpoint;
    }

    public Instant getTokenCreatedAt() {
        return tokenCreatedAt;
    }

    public void setTokenCreatedAt(Instant tokenCreatedAt) {
        this.tokenCreatedAt = tokenCreatedAt;
    }

    public Instant getTokenRevokedAt() {
        return tokenRevokedAt;
    }

    public void setTokenRevokedAt(Instant tokenRevokedAt) {
        this.tokenRevokedAt = tokenRevokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
