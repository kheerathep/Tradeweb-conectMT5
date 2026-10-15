package com.tradeweb.trade.dto;

import com.tradeweb.trade.entity.TradeDirection;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class CreateManualTradeRequest {

    @NotNull(message = "Trading account ID is required")
    private Long tradingAccountId;

    @NotNull(message = "Symbol is required")
    private String symbol;

    @NotNull(message = "Direction is required")
    private TradeDirection direction;

    @NotNull(message = "Total volume is required")
    private BigDecimal totalVolume;

    @NotNull(message = "Entry price is required")
    private BigDecimal entryPrice;

    private BigDecimal exitPrice;
    private Instant openedAt;
    private Instant closedAt;
    private BigDecimal grossPnl;
    private BigDecimal commissionTotal;
    private BigDecimal swapTotal;
    private String setupName;
    private String notes;

    public CreateManualTradeRequest() {}

    public Long getTradingAccountId() {
        return tradingAccountId;
    }

    public void setTradingAccountId(Long tradingAccountId) {
        this.tradingAccountId = tradingAccountId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public TradeDirection getDirection() {
        return direction;
    }

    public void setDirection(TradeDirection direction) {
        this.direction = direction;
    }

    public BigDecimal getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(BigDecimal totalVolume) {
        this.totalVolume = totalVolume;
    }

    public BigDecimal getEntryPrice() {
        return entryPrice;
    }

    public void setEntryPrice(BigDecimal entryPrice) {
        this.entryPrice = entryPrice;
    }

    public BigDecimal getExitPrice() {
        return exitPrice;
    }

    public void setExitPrice(BigDecimal exitPrice) {
        this.exitPrice = exitPrice;
    }

    public Instant getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(Instant openedAt) {
        this.openedAt = openedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public BigDecimal getGrossPnl() {
        return grossPnl;
    }

    public void setGrossPnl(BigDecimal grossPnl) {
        this.grossPnl = grossPnl;
    }

    public BigDecimal getCommissionTotal() {
        return commissionTotal;
    }

    public void setCommissionTotal(BigDecimal commissionTotal) {
        this.commissionTotal = commissionTotal;
    }

    public BigDecimal getSwapTotal() {
        return swapTotal;
    }

    public void setSwapTotal(BigDecimal swapTotal) {
        this.swapTotal = swapTotal;
    }

    public String getSetupName() {
        return setupName;
    }

    public void setSetupName(String setupName) {
        this.setupName = setupName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
