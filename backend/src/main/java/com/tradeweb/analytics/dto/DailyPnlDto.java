package com.tradeweb.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyPnlDto {

    private LocalDate date;
    private BigDecimal netPnl = BigDecimal.ZERO;
    private int tradesCount = 0;
    private int wins = 0;
    private int losses = 0;

    public DailyPnlDto() {}

    public DailyPnlDto(LocalDate date, BigDecimal netPnl, int tradesCount, int wins, int losses) {
        this.date = date;
        this.netPnl = netPnl;
        this.tradesCount = tradesCount;
        this.wins = wins;
        this.losses = losses;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getNetPnl() {
        return netPnl;
    }

    public void setNetPnl(BigDecimal netPnl) {
        this.netPnl = netPnl;
    }

    public int getTradesCount() {
        return tradesCount;
    }

    public void setTradesCount(int tradesCount) {
        this.tradesCount = tradesCount;
    }

    public int getWins() {
        return wins;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public int getLosses() {
        return losses;
    }

    public void setLosses(int losses) {
        this.losses = losses;
    }
}
