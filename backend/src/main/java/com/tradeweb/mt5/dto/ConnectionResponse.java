package com.tradeweb.mt5.dto;

import com.tradeweb.mt5.entity.ConnectionStatus;
import com.tradeweb.mt5.entity.Mt5Integration;
import java.math.BigDecimal;
import java.time.Instant;

public class ConnectionResponse {
    private Long id;
    private Long tradingAccountId;
    private ConnectionStatus connectionStatus;
    private String tokenPrefix;
    private String rawToken; // populated ONLY when newly created or rotated!
    private String mt5AccountName;
    private String mt5Company;
    private String mt5Server;
    private String mt5Currency;
    private BigDecimal mt5Balance;
    private BigDecimal mt5Equity;
    private Instant lastHeartbeatAt;
    private Instant lastSyncSuccessAt;
    private Instant lastSyncErrorAt;
    private String lastErrorMessage;
    private Long totalDealsImported;
    private Long totalTradesNormalized;
    private Instant syncCheckpoint;
    private Instant createdAt;

    public ConnectionResponse() {}

    public static ConnectionResponse fromEntity(Mt5Integration integration, String rawToken) {
        ConnectionResponse res = new ConnectionResponse();
        res.setId(integration.getId());
        res.setTradingAccountId(integration.getTradingAccountId());
        res.setConnectionStatus(integration.getConnectionStatus());
        res.setTokenPrefix(integration.getTokenPrefix());
        res.setRawToken(rawToken);
        res.setMt5AccountName(integration.getMt5AccountName());
        res.setMt5Company(integration.getMt5Company());
        res.setMt5Server(integration.getMt5Server());
        res.setMt5Currency(integration.getMt5Currency());
        res.setMt5Balance(integration.getMt5Balance());
        res.setMt5Equity(integration.getMt5Equity());
        res.setLastHeartbeatAt(integration.getLastHeartbeatAt());
        res.setLastSyncSuccessAt(integration.getLastSyncSuccessAt());
        res.setLastSyncErrorAt(integration.getLastSyncErrorAt());
        res.setLastErrorMessage(integration.getLastErrorMessage());
        res.setTotalDealsImported(integration.getTotalDealsImported());
        res.setTotalTradesNormalized(integration.getTotalTradesNormalized());
        res.setSyncCheckpoint(integration.getSyncCheckpoint());
        res.setCreatedAt(integration.getCreatedAt());
        return res;
    }

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

    public ConnectionStatus getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(ConnectionStatus connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public String getTokenPrefix() {
        return tokenPrefix;
    }

    public void setTokenPrefix(String tokenPrefix) {
        this.tokenPrefix = tokenPrefix;
    }

    public String getRawToken() {
        return rawToken;
    }

    public void setRawToken(String rawToken) {
        this.rawToken = rawToken;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
