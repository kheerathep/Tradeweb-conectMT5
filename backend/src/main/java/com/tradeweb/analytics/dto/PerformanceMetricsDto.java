package com.tradeweb.analytics.dto;

import java.math.BigDecimal;

public class PerformanceMetricsDto {

    private BigDecimal totalNetPnl = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal grossLoss = BigDecimal.ZERO;
    private double profitFactor = 0.0;
    private double winRate = 0.0;
    private int totalTrades = 0;
    private int winningTrades = 0;
    private int losingTrades = 0;
    private int breakEvenTrades = 0;
    private BigDecimal avgWin = BigDecimal.ZERO;
    private BigDecimal avgLoss = BigDecimal.ZERO;
    private double winLossRatio = 0.0;
    private BigDecimal expectancy = BigDecimal.ZERO;
    private BigDecimal maxDrawdownAmount = BigDecimal.ZERO;
    private double maxDrawdownPercent = 0.0;
    private int maxConsecutiveWins = 0;
    private int maxConsecutiveLosses = 0;
    private long avgHoldingSeconds = 0;

    public PerformanceMetricsDto() {}

    // Getters and Setters
    public BigDecimal getTotalNetPnl() {
        return totalNetPnl;
    }

    public void setTotalNetPnl(BigDecimal totalNetPnl) {
        this.totalNetPnl = totalNetPnl;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }

    public BigDecimal getGrossLoss() {
        return grossLoss;
    }

    public void setGrossLoss(BigDecimal grossLoss) {
        this.grossLoss = grossLoss;
    }

    public double getProfitFactor() {
        return profitFactor;
    }

    public void setProfitFactor(double profitFactor) {
        this.profitFactor = profitFactor;
    }

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
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

    public int getBreakEvenTrades() {
        return breakEvenTrades;
    }

    public void setBreakEvenTrades(int breakEvenTrades) {
        this.breakEvenTrades = breakEvenTrades;
    }

    public BigDecimal getAvgWin() {
        return avgWin;
    }

    public void setAvgWin(BigDecimal avgWin) {
        this.avgWin = avgWin;
    }

    public BigDecimal getAvgLoss() {
        return avgLoss;
    }

    public void setAvgLoss(BigDecimal avgLoss) {
        this.avgLoss = avgLoss;
    }

    public double getWinLossRatio() {
        return winLossRatio;
    }

    public void setWinLossRatio(double winLossRatio) {
        this.winLossRatio = winLossRatio;
    }

    public BigDecimal getExpectancy() {
        return expectancy;
    }

    public void setExpectancy(BigDecimal expectancy) {
        this.expectancy = expectancy;
    }

    public BigDecimal getMaxDrawdownAmount() {
        return maxDrawdownAmount;
    }

    public void setMaxDrawdownAmount(BigDecimal maxDrawdownAmount) {
        this.maxDrawdownAmount = maxDrawdownAmount;
    }

    public double getMaxDrawdownPercent() {
        return maxDrawdownPercent;
    }

    public void setMaxDrawdownPercent(double maxDrawdownPercent) {
        this.maxDrawdownPercent = maxDrawdownPercent;
    }

    public int getMaxConsecutiveWins() {
        return maxConsecutiveWins;
    }

    public void setMaxConsecutiveWins(int maxConsecutiveWins) {
        this.maxConsecutiveWins = maxConsecutiveWins;
    }

    public int getMaxConsecutiveLosses() {
        return maxConsecutiveLosses;
    }

    public void setMaxConsecutiveLosses(int maxConsecutiveLosses) {
        this.maxConsecutiveLosses = maxConsecutiveLosses;
    }

    public long getAvgHoldingSeconds() {
        return avgHoldingSeconds;
    }

    public void setAvgHoldingSeconds(long avgHoldingSeconds) {
        this.avgHoldingSeconds = avgHoldingSeconds;
    }
}
