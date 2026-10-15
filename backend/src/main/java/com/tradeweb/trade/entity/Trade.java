package com.tradeweb.trade.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "trades")
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trading_account_id", nullable = false)
    private Long tradingAccountId;

    @Column(name = "symbol", length = 50)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false)
    private TradeDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_source", nullable = false)
    private TradeSource tradeSource = TradeSource.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_status", nullable = false)
    private TradeStatus tradeStatus = TradeStatus.OPEN;

    @Column(name = "entry_price", precision = 18, scale = 8)
    private BigDecimal entryPrice;

    @Column(name = "exit_price", precision = 18, scale = 8)
    private BigDecimal exitPrice;

    @Column(name = "total_volume", precision = 18, scale = 8)
    private BigDecimal totalVolume = BigDecimal.ZERO;

    @Column(name = "closed_volume", precision = 18, scale = 8)
    private BigDecimal closedVolume = BigDecimal.ZERO;

    @Column(name = "remaining_volume", precision = 18, scale = 8)
    private BigDecimal remainingVolume = BigDecimal.ZERO;

    @Column(name = "gross_pnl", precision = 18, scale = 2)
    private BigDecimal grossPnl;

    @Column(name = "commission_total", precision = 18, scale = 2)
    private BigDecimal commissionTotal = BigDecimal.ZERO;

    @Column(name = "swap_total", precision = 18, scale = 2)
    private BigDecimal swapTotal = BigDecimal.ZERO;

    @Column(name = "fee_total", precision = 18, scale = 2)
    private BigDecimal feeTotal = BigDecimal.ZERO;

    @Column(name = "net_pnl", precision = 18, scale = 2)
    private BigDecimal netPnl;

    @Column(name = "risk_amount", precision = 18, scale = 2)
    private BigDecimal riskAmount;

    @Column(name = "r_multiple", precision = 10, scale = 4)
    private BigDecimal rMultiple;

    @Column(name = "opened_at")
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "external_position_id")
    private Long externalPositionId;

    @Column(name = "strategy_id")
    private Long strategyId;

    @Column(name = "setup_name", length = 200)
    private String setupName;

    @Column(name = "entry_reason", columnDefinition = "TEXT")
    private String entryReason;

    @Column(name = "exit_reason", columnDefinition = "TEXT")
    private String exitReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "emotion_before")
    private EmotionBefore emotionBefore;

    @Enumerated(EnumType.STRING)
    @Column(name = "emotion_after")
    private EmotionAfter emotionAfter;

    @Column(name = "followed_rules")
    private Boolean followedRules;

    @Column(name = "mistakes", columnDefinition = "TEXT")
    private String mistakes;

    @Column(name = "post_trade_review", columnDefinition = "TEXT")
    private String postTradeReview;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Trade() {}

    public Trade(Long tradingAccountId, String symbol, TradeDirection direction, TradeSource tradeSource) {
        this.tradingAccountId = tradingAccountId;
        this.symbol = symbol;
        this.direction = direction;
        this.tradeSource = tradeSource != null ? tradeSource : TradeSource.MANUAL;
        this.tradeStatus = TradeStatus.OPEN;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public TradeSource getTradeSource() {
        return tradeSource;
    }

    public void setTradeSource(TradeSource tradeSource) {
        this.tradeSource = tradeSource;
    }

    public TradeStatus getTradeStatus() {
        return tradeStatus;
    }

    public void setTradeStatus(TradeStatus tradeStatus) {
        this.tradeStatus = tradeStatus;
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

    public BigDecimal getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(BigDecimal totalVolume) {
        this.totalVolume = totalVolume;
    }

    public BigDecimal getClosedVolume() {
        return closedVolume;
    }

    public void setClosedVolume(BigDecimal closedVolume) {
        this.closedVolume = closedVolume;
    }

    public BigDecimal getRemainingVolume() {
        return remainingVolume;
    }

    public void setRemainingVolume(BigDecimal remainingVolume) {
        this.remainingVolume = remainingVolume;
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

    public BigDecimal getFeeTotal() {
        return feeTotal;
    }

    public void setFeeTotal(BigDecimal feeTotal) {
        this.feeTotal = feeTotal;
    }

    public BigDecimal getNetPnl() {
        return netPnl;
    }

    public void setNetPnl(BigDecimal netPnl) {
        this.netPnl = netPnl;
    }

    public BigDecimal getRiskAmount() {
        return riskAmount;
    }

    public void setRiskAmount(BigDecimal riskAmount) {
        this.riskAmount = riskAmount;
    }

    public BigDecimal getRMultiple() {
        return rMultiple;
    }

    public void setRMultiple(BigDecimal rMultiple) {
        this.rMultiple = rMultiple;
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

    public Long getExternalPositionId() {
        return externalPositionId;
    }

    public void setExternalPositionId(Long externalPositionId) {
        this.externalPositionId = externalPositionId;
    }

    public Long getStrategyId() {
        return strategyId;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
    }

    public String getSetupName() {
        return setupName;
    }

    public void setSetupName(String setupName) {
        this.setupName = setupName;
    }

    public String getEntryReason() {
        return entryReason;
    }

    public void setEntryReason(String entryReason) {
        this.entryReason = entryReason;
    }

    public String getExitReason() {
        return exitReason;
    }

    public void setExitReason(String exitReason) {
        this.exitReason = exitReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public EmotionBefore getEmotionBefore() {
        return emotionBefore;
    }

    public void setEmotionBefore(EmotionBefore emotionBefore) {
        this.emotionBefore = emotionBefore;
    }

    public EmotionAfter getEmotionAfter() {
        return emotionAfter;
    }

    public void setEmotionAfter(EmotionAfter emotionAfter) {
        this.emotionAfter = emotionAfter;
    }

    public Boolean getFollowedRules() {
        return followedRules;
    }

    public void setFollowedRules(Boolean followedRules) {
        this.followedRules = followedRules;
    }

    public String getMistakes() {
        return mistakes;
    }

    public void setMistakes(String mistakes) {
        this.mistakes = mistakes;
    }

    public String getPostTradeReview() {
        return postTradeReview;
    }

    public void setPostTradeReview(String postTradeReview) {
        this.postTradeReview = postTradeReview;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
