package com.tradeweb.account.dto;

import com.tradeweb.account.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CreateAccountRequest {

    @NotBlank(message = "Account name is required")
    private String accountName;

    private String broker;
    private String mt5Server;

    @NotNull(message = "Account type is required")
    private AccountType accountType = AccountType.PERSONAL;

    private String currency = "USD";
    private BigDecimal initialBalance = BigDecimal.ZERO;

    public CreateAccountRequest() {}

    public CreateAccountRequest(String accountName, String broker, String mt5Server, AccountType accountType, String currency, BigDecimal initialBalance) {
        this.accountName = accountName;
        this.broker = broker;
        this.mt5Server = mt5Server;
        this.accountType = accountType != null ? accountType : AccountType.PERSONAL;
        this.currency = currency != null ? currency : "USD";
        this.initialBalance = initialBalance != null ? initialBalance : BigDecimal.ZERO;
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
}
