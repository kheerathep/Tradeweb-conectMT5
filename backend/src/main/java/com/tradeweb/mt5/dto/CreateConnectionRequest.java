package com.tradeweb.mt5.dto;

import jakarta.validation.constraints.NotNull;

public class CreateConnectionRequest {

    @NotNull(message = "Trading account ID is required")
    private Long tradingAccountId;

    public CreateConnectionRequest() {}

    public CreateConnectionRequest(Long tradingAccountId) {
        this.tradingAccountId = tradingAccountId;
    }

    public Long getTradingAccountId() {
        return tradingAccountId;
    }

    public void setTradingAccountId(Long tradingAccountId) {
        this.tradingAccountId = tradingAccountId;
    }
}
