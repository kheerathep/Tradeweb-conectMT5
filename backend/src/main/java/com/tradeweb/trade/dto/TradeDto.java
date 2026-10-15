package com.tradeweb.trade.dto;

import com.tradeweb.trade.entity.*;
import java.math.BigDecimal;
import java.time.Instant;

public class TradeDto {

    private Long id;
    private Long tradingAccountId;
    private String symbol;
    private TradeDirection direction;
    private TradeSource tradeSource;
    private TradeStatus tradeStatus;
    private BigDecimal entryPrice;
    private BigDecimal exitPrice;
    private BigDecimal totalVolume;
    private BigDecimal closedVolume;
    private BigDecimal remainingVolume;
    private BigDecimal grossPnl;
    private BigDecimal commissionTotal;
    private BigDecimal swapTotal;
    private BigDecimal feeTotal;
    private BigDecimal netPnl;
    private BigDecimal riskAmount;
    @com.fasterxml.jackson.annotation.JsonProperty("rMultiple")
    private BigDecimal rMultiple;
    private Instant openedAt;
    private Instant closedAt;
    private Long externalPositionId;
    private String setupName;
    private String entryReason;
    private String exitReason;
    private String notes;
    private EmotionBefore emotionBefore;
    private EmotionAfter emotionAfter;
    private Boolean followedRules;
    private String mistakes;
    private String postTradeReview;
    private Integer rating;
    private Instant createdAt;

    public TradeDto() {}

    public static TradeDto fromEntity(Trade trade) {
        TradeDto dto = new TradeDto();
        dto.setId(trade.getId());
        dto.setTradingAccountId(trade.getTradingAccountId());
        dto.setSymbol(trade.getSymbol());
        dto.setDirection(trade.getDirection());
        dto.setTradeSource(trade.getTradeSource());
        dto.setTradeStatus(trade.getTradeStatus());
        dto.setEntryPrice(trade.getEntryPrice());
        dto.setExitPrice(trade.getExitPrice());
        dto.setTotalVolume(trade.getTotalVolume());
        dto.setClosedVolume(trade.getClosedVolume());
        dto.setRemainingVolume(trade.getRemainingVolume());
        dto.setGrossPnl(trade.getGrossPnl());
        dto.setCommissionTotal(trade.getCommissionTotal());
        dto.setSwapTotal(trade.getSwapTotal());
        dto.setFeeTotal(trade.getFeeTotal());
        dto.setNetPnl(trade.getNetPnl());
        dto.setRiskAmount(trade.getRiskAmount());
        dto.setRMultiple(trade.getRMultiple());
        dto.setOpenedAt(trade.getOpenedAt());
        dto.setClosedAt(trade.getClosedAt());
        dto.setExternalPositionId(trade.getExternalPositionId());
        dto.setSetupName(trade.getSetupName());
        dto.setEntryReason(trade.getEntryReason());
        dto.setExitReason(trade.getExitReason());
        dto.setNotes(trade.getNotes());
        dto.setEmotionBefore(trade.getEmotionBefore());
        dto.setEmotionAfter(trade.getEmotionAfter());
        dto.setFollowedRules(trade.getFollowedRules());
        dto.setMistakes(trade.getMistakes());
        dto.setPostTradeReview(trade.getPostTradeReview());
        dto.setRating(trade.getRating());
        dto.setCreatedAt(trade.getCreatedAt());
        return dto;
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

    @com.fasterxml.jackson.annotation.JsonProperty("rMultiple")
    public BigDecimal getRMultiple() {
        return rMultiple;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("rMultiple")
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
}
