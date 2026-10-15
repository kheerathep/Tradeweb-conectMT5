package com.tradeweb.account.dto;

import com.tradeweb.account.entity.AccountStatus;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.account.entity.TradingAccount;
import java.math.BigDecimal;
import java.time.Instant;

public class TradingAccountDto {
    private Long id;
    private Long userId;
    private String accountName;
    private String broker;
    private String mt5Server;
    private AccountType accountType;
    private String currency;
    private BigDecimal initialBalance;
    private AccountStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public TradingAccountDto() {}

    public static TradingAccountDto fromEntity(TradingAccount account) {
        TradingAccountDto dto = new TradingAccountDto();
        dto.setId(account.getId());
        dto.setUserId(account.getUserId());
        dto.setAccountName(account.getAccountName());
        dto.setBroker(account.getBroker());
        dto.setMt5Server(account.getMt5Server());
        dto.setAccountType(account.getAccountType());
        dto.setCurrency(account.getCurrency());
        dto.setInitialBalance(account.getInitialBalance());
        dto.setStatus(account.getStatus());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setUpdatedAt(account.getUpdatedAt());
        return dto;
    }

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
