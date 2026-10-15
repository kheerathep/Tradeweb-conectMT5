package com.tradeweb.analytics.dto;

import java.util.ArrayList;
import java.util.List;

public class AnalyticsReportDto {

    private PerformanceMetricsDto performance = new PerformanceMetricsDto();
    private List<EquityPointDto> equityCurve = new ArrayList<>();
    private List<DailyPnlDto> dailyPnl = new ArrayList<>();
    private List<BreakdownItemDto> bySymbol = new ArrayList<>();
    private List<BreakdownItemDto> byDayOfWeek = new ArrayList<>();
    private List<BreakdownItemDto> bySession = new ArrayList<>();
    private List<BreakdownItemDto> byDirection = new ArrayList<>();
    private List<BreakdownItemDto> bySetup = new ArrayList<>();
    private List<BreakdownItemDto> byEmotion = new ArrayList<>();
    private List<BreakdownItemDto> byRuleCompliance = new ArrayList<>();
    private List<BreakdownItemDto> byMistakes = new ArrayList<>();

    public AnalyticsReportDto() {}

    public PerformanceMetricsDto getPerformance() {
        return performance;
    }

    public void setPerformance(PerformanceMetricsDto performance) {
        this.performance = performance;
    }

    public List<EquityPointDto> getEquityCurve() {
        return equityCurve;
    }

    public void setEquityCurve(List<EquityPointDto> equityCurve) {
        this.equityCurve = equityCurve;
    }

    public List<DailyPnlDto> getDailyPnl() {
        return dailyPnl;
    }

    public void setDailyPnl(List<DailyPnlDto> dailyPnl) {
        this.dailyPnl = dailyPnl;
    }

    public List<BreakdownItemDto> getBySymbol() {
        return bySymbol;
    }

    public void setBySymbol(List<BreakdownItemDto> bySymbol) {
        this.bySymbol = bySymbol;
    }

    public List<BreakdownItemDto> getByDayOfWeek() {
        return byDayOfWeek;
    }

    public void setByDayOfWeek(List<BreakdownItemDto> byDayOfWeek) {
        this.byDayOfWeek = byDayOfWeek;
    }

    public List<BreakdownItemDto> getBySession() {
        return bySession;
    }

    public void setBySession(List<BreakdownItemDto> bySession) {
        this.bySession = bySession;
    }

    public List<BreakdownItemDto> getByDirection() {
        return byDirection;
    }

    public void setByDirection(List<BreakdownItemDto> byDirection) {
        this.byDirection = byDirection;
    }

    public List<BreakdownItemDto> getBySetup() {
        return bySetup;
    }

    public void setBySetup(List<BreakdownItemDto> bySetup) {
        this.bySetup = bySetup;
    }

    public List<BreakdownItemDto> getByEmotion() {
        return byEmotion;
    }

    public void setByEmotion(List<BreakdownItemDto> byEmotion) {
        this.byEmotion = byEmotion;
    }

    public List<BreakdownItemDto> getByRuleCompliance() {
        return byRuleCompliance;
    }

    public void setByRuleCompliance(List<BreakdownItemDto> byRuleCompliance) {
        this.byRuleCompliance = byRuleCompliance;
    }

    public List<BreakdownItemDto> getByMistakes() {
        return byMistakes;
    }

    public void setByMistakes(List<BreakdownItemDto> byMistakes) {
        this.byMistakes = byMistakes;
    }
}
