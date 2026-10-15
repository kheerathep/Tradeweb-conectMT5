package com.tradeweb.account.dto;

import com.tradeweb.account.entity.AccountStatus;
import com.tradeweb.account.entity.AccountType;
import java.math.BigDecimal;

public class UpdateAccountRequest {
    private String accountName;
    private String broker;
    private String mt5Server;
    private AccountType accountType;
    private BigDecimal initialBalance;
    private AccountStatus status;

    public UpdateAccountRequest() {}

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
}
