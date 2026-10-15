package com.tradeweb.account.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "trading_accounts")
public class TradingAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Column(name = "broker")
    private String broker;

    @Column(name = "mt5_server")
    private String mt5Server;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType = AccountType.PERSONAL;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @Column(name = "initial_balance", precision = 18, scale = 2)
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public TradingAccount() {}

    public TradingAccount(
            Long userId,
            String accountName,
            String broker,
            String mt5Server,
            AccountType accountType,
            String currency,
            BigDecimal initialBalance,
            AccountStatus status
    ) {
        this.userId = userId;
        this.accountName = accountName;
        this.broker = broker;
        this.mt5Server = mt5Server;
        this.accountType = accountType != null ? accountType : AccountType.PERSONAL;
        this.currency = currency != null ? currency : "USD";
        this.initialBalance = initialBalance != null ? initialBalance : BigDecimal.ZERO;
        this.status = status != null ? status : AccountStatus.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getBroker() {
        return broker;
    }

    public void setBroker(String broker) {
        this.broker = broker;
    }

    public String getMt5Server() {
        return mt5Server;
    }

    public void setMt5Server(String mt5Server) {
        this.mt5Server = mt5Server;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(BigDecimal initialBalance) {
        this.initialBalance = initialBalance;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
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
