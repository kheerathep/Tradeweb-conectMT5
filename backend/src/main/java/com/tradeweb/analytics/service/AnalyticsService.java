package com.tradeweb.analytics.service;

import com.tradeweb.account.entity.TradingAccount;
import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.analytics.dto.*;
import com.tradeweb.common.exception.ResourceNotFoundException;
import com.tradeweb.trade.entity.Trade;
import com.tradeweb.trade.entity.TradeStatus;
import com.tradeweb.trade.repository.TradeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TradeRepository tradeRepository;
    private final TradingAccountRepository tradingAccountRepository;

    public AnalyticsService(TradeRepository tradeRepository, TradingAccountRepository tradingAccountRepository) {
        this.tradeRepository = tradeRepository;
        this.tradingAccountRepository = tradingAccountRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsReportDto getAnalyticsReport(Long userId, Long accountId, Instant fromTime, Instant toTime) {
        TradingAccount account = tradingAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));

        List<Trade> allTrades = tradeRepository.filterTrades(accountId, null, null, fromTime, toTime);
        List<Trade> closedTrades = allTrades.stream()
                .filter(t -> t.getTradeStatus() == TradeStatus.CLOSED)
                .sorted(Comparator.comparing(t -> t.getClosedAt() != null ? t.getClosedAt() : t.getOpenedAt() != null ? t.getOpenedAt() : Instant.EPOCH))
                .collect(Collectors.toList());

        AnalyticsReportDto report = new AnalyticsReportDto();

        // 1. Performance Metrics
        PerformanceMetricsDto perf = calculatePerformanceMetrics(closedTrades, account);
        perf.setTotalTrades(allTrades.size());
        report.setPerformance(perf);

        // 2. Equity & Drawdown Curve
        report.setEquityCurve(calculateEquityAndDrawdown(closedTrades, account, perf));

        // 3. Daily P&L
        report.setDailyPnl(calculateDailyPnl(closedTrades));

        // 4. Breakdowns
        report.setBySymbol(buildBreakdown(closedTrades, t -> t.getSymbol() != null ? t.getSymbol() : "Unknown"));
        report.setByDirection(buildBreakdown(closedTrades, t -> t.getDirection() != null ? t.getDirection().name() : "Unknown"));
        report.setByDayOfWeek(buildBreakdown(closedTrades, this::extractDayOfWeek));
        report.setBySession(buildBreakdown(closedTrades, this::extractTradingSession));
        report.setBySetup(buildBreakdown(closedTrades, t -> t.getSetupName() != null && !t.getSetupName().trim().isEmpty() ? t.getSetupName() : "Unlabeled"));
        report.setByEmotion(buildBreakdown(closedTrades, t -> t.getEmotionBefore() != null ? t.getEmotionBefore().name() : "Unspecified"));
        report.setByRuleCompliance(buildBreakdown(closedTrades, t -> t.getFollowedRules() == null ? "Not Recorded" : t.getFollowedRules() ? "Followed Rules" : "Rule Violated"));
        report.setByMistakes(buildBreakdown(closedTrades, t -> t.getMistakes() != null && !t.getMistakes().trim().isEmpty() ? t.getMistakes() : "None"));

        return report;
    }

    private PerformanceMetricsDto calculatePerformanceMetrics(List<Trade> closedTrades, TradingAccount account) {
        PerformanceMetricsDto metrics = new PerformanceMetricsDto();
        if (closedTrades.isEmpty()) {
            return metrics;
        }

        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal grossProfit = BigDecimal.ZERO;
        BigDecimal grossLoss = BigDecimal.ZERO;
        int wins = 0;
        int losses = 0;
        int breakEvens = 0;

        int currentConsecutiveWins = 0;
        int maxConsecutiveWins = 0;
        int currentConsecutiveLosses = 0;
        int maxConsecutiveLosses = 0;

        long totalHoldingSecs = 0;
        int validHoldingCount = 0;

        for (Trade trade : closedTrades) {
            BigDecimal net = trade.getNetPnl() != null ? trade.getNetPnl() : BigDecimal.ZERO;
            totalNet = totalNet.add(net);

            if (net.compareTo(BigDecimal.ZERO) > 0) {
                wins++;
                grossProfit = grossProfit.add(net);
                currentConsecutiveWins++;
                currentConsecutiveLosses = 0;
                if (currentConsecutiveWins > maxConsecutiveWins) {
                    maxConsecutiveWins = currentConsecutiveWins;
                }
            } else if (net.compareTo(BigDecimal.ZERO) < 0) {
                losses++;
                grossLoss = grossLoss.add(net.abs());
                currentConsecutiveLosses++;
                currentConsecutiveWins = 0;
                if (currentConsecutiveLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecutiveLosses;
                }
            } else {
                breakEvens++;
                currentConsecutiveWins = 0;
                currentConsecutiveLosses = 0;
            }

            if (trade.getOpenedAt() != null && trade.getClosedAt() != null) {
                long duration = Duration.between(trade.getOpenedAt(), trade.getClosedAt()).getSeconds();
                if (duration >= 0) {
                    totalHoldingSecs += duration;
                    validHoldingCount++;
                }
            }
        }

        int totalClosed = closedTrades.size();
        double winRate = (double) wins * 100.0 / totalClosed;
        double profitFactor = grossLoss.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(grossLoss, 4, RoundingMode.HALF_UP).doubleValue()
                : (grossProfit.compareTo(BigDecimal.ZERO) > 0 ? 99.0 : 0.0);

        BigDecimal avgWin = wins > 0 ? grossProfit.divide(BigDecimal.valueOf(wins), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal avgLoss = losses > 0 ? grossLoss.divide(BigDecimal.valueOf(losses), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        double winLossRatio = avgLoss.compareTo(BigDecimal.ZERO) > 0
                ? avgWin.divide(avgLoss, 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        // Expectancy = (winRate * avgWin) - (lossRate * avgLoss)
        BigDecimal winPart = avgWin.multiply(BigDecimal.valueOf(winRate / 100.0));
        BigDecimal lossPart = avgLoss.multiply(BigDecimal.valueOf((100.0 - winRate) / 100.0));
        BigDecimal expectancy = winPart.subtract(lossPart);

        metrics.setTotalNetPnl(totalNet);
        metrics.setGrossProfit(grossProfit);
        metrics.setGrossLoss(grossLoss);
        metrics.setProfitFactor(profitFactor);
        metrics.setWinRate(winRate);
        metrics.setWinningTrades(wins);
        metrics.setLosingTrades(losses);
        metrics.setBreakEvenTrades(breakEvens);
        metrics.setAvgWin(avgWin);
        metrics.setAvgLoss(avgLoss);
        metrics.setWinLossRatio(winLossRatio);
        metrics.setExpectancy(expectancy);
        metrics.setMaxConsecutiveWins(maxConsecutiveWins);
        metrics.setMaxConsecutiveLosses(maxConsecutiveLosses);
        metrics.setAvgHoldingSeconds(validHoldingCount > 0 ? totalHoldingSecs / validHoldingCount : 0);

        return metrics;
    }

    private List<EquityPointDto> calculateEquityAndDrawdown(
            List<Trade> closedTrades,
            TradingAccount account,
            PerformanceMetricsDto metrics
    ) {
        BigDecimal initialBal = account.getInitialBalance() != null ? account.getInitialBalance() : BigDecimal.valueOf(10000);
        BigDecimal runningEquity = initialBal;
        BigDecimal peakEquity = runningEquity;

        BigDecimal maxDdAmount = BigDecimal.ZERO;
        double maxDdPercent = 0.0;

        List<EquityPointDto> points = new ArrayList<>();
        points.add(new EquityPointDto(account.getCreatedAt(), "Start", runningEquity, BigDecimal.ZERO, BigDecimal.ZERO, 0.0));

        int tradeIndex = 1;
        for (Trade trade : closedTrades) {
            BigDecimal net = trade.getNetPnl() != null ? trade.getNetPnl() : BigDecimal.ZERO;
            runningEquity = runningEquity.add(net);

            if (runningEquity.compareTo(peakEquity) > 0) {
                peakEquity = runningEquity;
            }

            BigDecimal ddAmount = peakEquity.subtract(runningEquity);
            double ddPct = peakEquity.compareTo(BigDecimal.ZERO) > 0
                    ? ddAmount.divide(peakEquity, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            if (ddAmount.compareTo(maxDdAmount) > 0) {
                maxDdAmount = ddAmount;
            }
            if (ddPct > maxDdPercent) {
                maxDdPercent = ddPct;
            }

            Instant time = trade.getClosedAt() != null ? trade.getClosedAt() : Instant.now();
            String label = trade.getSymbol() != null ? trade.getSymbol() : "Trade " + tradeIndex;
            points.add(new EquityPointDto(time, label, runningEquity, net, ddAmount, ddPct));
            tradeIndex++;
        }

        metrics.setMaxDrawdownAmount(maxDdAmount);
        metrics.setMaxDrawdownPercent(maxDdPercent);

        return points;
    }

    private List<DailyPnlDto> calculateDailyPnl(List<Trade> closedTrades) {
        Map<LocalDate, List<Trade>> byDate = closedTrades.stream()
                .filter(t -> t.getClosedAt() != null)
                .collect(Collectors.groupingBy(t -> t.getClosedAt().atZone(ZoneOffset.UTC).toLocalDate()));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Trade> dayTrades = entry.getValue();
                    BigDecimal net = BigDecimal.ZERO;
                    int wins = 0;
                    int losses = 0;

                    for (Trade t : dayTrades) {
                        BigDecimal pnl = t.getNetPnl() != null ? t.getNetPnl() : BigDecimal.ZERO;
                        net = net.add(pnl);
                        if (pnl.compareTo(BigDecimal.ZERO) > 0) wins++;
                        else if (pnl.compareTo(BigDecimal.ZERO) < 0) losses++;
                    }

                    return new DailyPnlDto(date, net, dayTrades.size(), wins, losses);
                })
                .collect(Collectors.toList());
    }

    private List<BreakdownItemDto> buildBreakdown(List<Trade> trades, Function<Trade, String> keyExtractor) {
        Map<String, List<Trade>> groups = trades.stream().collect(Collectors.groupingBy(keyExtractor));

        return groups.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    List<Trade> groupTrades = entry.getValue();

                    int total = groupTrades.size();
                    int wins = 0;
                    int losses = 0;
                    BigDecimal netPnl = BigDecimal.ZERO;
                    BigDecimal grossProfit = BigDecimal.ZERO;
                    BigDecimal grossLoss = BigDecimal.ZERO;

                    for (Trade t : groupTrades) {
                        BigDecimal net = t.getNetPnl() != null ? t.getNetPnl() : BigDecimal.ZERO;
                        netPnl = netPnl.add(net);
                        if (net.compareTo(BigDecimal.ZERO) > 0) {
                            wins++;
                            grossProfit = grossProfit.add(net);
                        } else if (net.compareTo(BigDecimal.ZERO) < 0) {
                            losses++;
                            grossLoss = grossLoss.add(net.abs());
                        }
                    }

                    double winRate = total > 0 ? (double) wins * 100.0 / total : 0.0;
                    double pf = grossLoss.compareTo(BigDecimal.ZERO) > 0
                            ? grossProfit.divide(grossLoss, 2, RoundingMode.HALF_UP).doubleValue()
                            : (grossProfit.compareTo(BigDecimal.ZERO) > 0 ? 99.0 : 0.0);

                    return new BreakdownItemDto(key, total, wins, losses, winRate, netPnl, pf);
                })
                .sorted((a, b) -> Integer.compare(b.getTotalTrades(), a.getTotalTrades()))
                .collect(Collectors.toList());
    }

    private String extractDayOfWeek(Trade trade) {
        Instant time = trade.getOpenedAt() != null ? trade.getOpenedAt() : trade.getClosedAt();
        if (time == null) return "Unknown";
        return time.atZone(ZoneOffset.UTC).getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private String extractTradingSession(Trade trade) {
        Instant time = trade.getOpenedAt() != null ? trade.getOpenedAt() : trade.getClosedAt();
        if (time == null) return "Unknown";

        int hour = time.atZone(ZoneOffset.UTC).getHour();
        if (hour >= 0 && hour < 8) {
            return "Asian Session (00:00-08:00 UTC)";
        } else if (hour >= 8 && hour < 13) {
            return "London Session (08:00-13:00 UTC)";
        } else if (hour >= 13 && hour < 17) {
            return "London/NY Overlap (13:00-17:00 UTC)";
        } else if (hour >= 17 && hour < 22) {
            return "New York Session (17:00-22:00 UTC)";
        } else {
            return "Late Off-Hours (22:00-00:00 UTC)";
        }
    }
}
