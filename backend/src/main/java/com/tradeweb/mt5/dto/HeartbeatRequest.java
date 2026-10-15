package com.tradeweb.mt5.dto;

import java.math.BigDecimal;

public class HeartbeatRequest {

    private Long accountLogin;
    private String accountName;
    private String company;
    private String server;
    private String currency;
    private BigDecimal balance;
    private BigDecimal equity;
    private String terminalVersion;
    private String eaVersion;

    public HeartbeatRequest() {}

    public Long getAccountLogin() {
        return accountLogin;
    }

    public void setAccountLogin(Long accountLogin) {
        this.accountLogin = accountLogin;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getServer() {
        return server;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getEquity() {
        return equity;
    }

    public void setEquity(BigDecimal equity) {
        this.equity = equity;
    }

    public String getTerminalVersion() {
        return terminalVersion;
    }

    public void setTerminalVersion(String terminalVersion) {
        this.terminalVersion = terminalVersion;
    }

    public String getEaVersion() {
        return eaVersion;
    }

    public void setEaVersion(String eaVersion) {
        this.eaVersion = eaVersion;
    }
}
