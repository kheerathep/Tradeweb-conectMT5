package com.tradeweb.analytics.dto;

import java.math.BigDecimal;

public class BreakdownItemDto {

    private String key;
    private int totalTrades;
    private int winningTrades;
    private int losingTrades;
    private double winRate;
    private BigDecimal netPnl = BigDecimal.ZERO;
    private double profitFactor;

    public BreakdownItemDto() {}

    public BreakdownItemDto(String key, int totalTrades, int winningTrades, int losingTrades, double winRate, BigDecimal netPnl, double profitFactor) {
        this.key = key;
        this.totalTrades = totalTrades;
        this.winningTrades = winningTrades;
        this.losingTrades = losingTrades;
        this.winRate = winRate;
        this.netPnl = netPnl;
        this.profitFactor = profitFactor;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public int getTotalTrades() {
        return totalTrades;
    }

    public void setTotalTrades(int totalTrades) {
        this.totalTrades = totalTrades;
    }

    public int getWinningTrades() {
        return winningTrades;
    }

    public void setWinningTrades(int winningTrades) {
        this.winningTrades = winningTrades;
    }

    public int getLosingTrades() {
        return losingTrades;
    }

    public void setLosingTrades(int losingTrades) {
        this.losingTrades = losingTrades;
    }

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
    }

    public BigDecimal getNetPnl() {
        return netPnl;
    }

    public void setNetPnl(BigDecimal netPnl) {
        this.netPnl = netPnl;
    }

    public double getProfitFactor() {
        return profitFactor;
    }

    public void setProfitFactor(double profitFactor) {
        this.profitFactor = profitFactor;
    }
}
