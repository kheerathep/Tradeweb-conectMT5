package com.tradeweb.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class EquityPointDto {

    private Instant timestamp;
    private String label;
    private BigDecimal equity;
    private BigDecimal netPnl;
    private BigDecimal drawdownAmount;
    private double drawdownPercent;

    public EquityPointDto() {}

    public EquityPointDto(Instant timestamp, String label, BigDecimal equity, BigDecimal netPnl, BigDecimal drawdownAmount, double drawdownPercent) {
        this.timestamp = timestamp;
        this.label = label;
        this.equity = equity;
        this.netPnl = netPnl;
        this.drawdownAmount = drawdownAmount;
        this.drawdownPercent = drawdownPercent;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public BigDecimal getEquity() {
        return equity;
    }

    public void setEquity(BigDecimal equity) {
        this.equity = equity;
    }

    public BigDecimal getNetPnl() {
        return netPnl;
    }

    public void setNetPnl(BigDecimal netPnl) {
        this.netPnl = netPnl;
    }

    public BigDecimal getDrawdownAmount() {
        return drawdownAmount;
    }

    public void setDrawdownAmount(BigDecimal drawdownAmount) {
        this.drawdownAmount = drawdownAmount;
    }

    public double getDrawdownPercent() {
        return drawdownPercent;
    }

    public void setDrawdownPercent(double drawdownPercent) {
        this.drawdownPercent = drawdownPercent;
    }
}
