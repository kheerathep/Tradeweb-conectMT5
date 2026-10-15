package com.tradeweb.mt5.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "mt5_deals",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_deals_integration_ticket",
            columnNames = {"integration_id", "external_deal_ticket"}
        )
    }
)
public class Mt5Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "integration_id", nullable = false)
    private Long integrationId;

    @Column(name = "trade_id")
    private Long tradeId;

    @Column(name = "external_deal_ticket", nullable = false)
    private Long externalDealTicket;

    @Column(name = "external_position_id")
    private Long externalPositionId;

    @Column(name = "external_order_ticket")
    private Long externalOrderTicket;

    @Column(name = "symbol", length = 50)
    private String symbol;

    @Column(name = "deal_type", nullable = false, length = 50)
    private String dealType;

    @Column(name = "entry_type", length = 20)
    private String entryType;

    @Column(name = "volume", precision = 18, scale = 8, nullable = false)
    private BigDecimal volume = BigDecimal.ZERO;

    @Column(name = "price", precision = 18, scale = 8, nullable = false)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "deal_time", nullable = false)
    private Instant dealTime;

    @Column(name = "profit", precision = 18, scale = 2, nullable = false)
    private BigDecimal profit = BigDecimal.ZERO;

    @Column(name = "commission", precision = 18, scale = 2, nullable = false)
    private BigDecimal commission = BigDecimal.ZERO;

    @Column(name = "swap", precision = 18, scale = 2, nullable = false)
    private BigDecimal swap = BigDecimal.ZERO;

    @Column(name = "fee", precision = 18, scale = 2, nullable = false)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "deal_reason")
    private Integer dealReason;

    @Column(name = "magic_number")
    private Long magicNumber;

    @Column(name = "deal_comment", length = 500)
    private String dealComment;

    @Column(name = "source_platform", nullable = false, length = 20)
    private String sourcePlatform = "MT5";

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Mt5Deal() {}

    public Mt5Deal(
            Long integrationId,
            Long externalDealTicket,
            Long externalPositionId,
            Long externalOrderTicket,
            String symbol,
            String dealType,
            String entryType,
            BigDecimal volume,
            BigDecimal price,
            Instant dealTime,
            BigDecimal profit,
            BigDecimal commission,
            BigDecimal swap,
            BigDecimal fee,
            Integer dealReason,
            Long magicNumber,
            String dealComment
    ) {
        this.integrationId = integrationId;
        this.externalDealTicket = externalDealTicket;
        this.externalPositionId = externalPositionId;
        this.externalOrderTicket = externalOrderTicket;
        this.symbol = symbol;
        this.dealType = dealType;
        this.entryType = entryType;
        this.volume = volume != null ? volume : BigDecimal.ZERO;
        this.price = price != null ? price : BigDecimal.ZERO;
        this.dealTime = dealTime;
        this.profit = profit != null ? profit : BigDecimal.ZERO;
        this.commission = commission != null ? commission : BigDecimal.ZERO;
        this.swap = swap != null ? swap : BigDecimal.ZERO;
        this.fee = fee != null ? fee : BigDecimal.ZERO;
        this.dealReason = dealReason;
        this.magicNumber = magicNumber;
        this.dealComment = dealComment;
        this.sourcePlatform = "MT5";
        this.receivedAt = Instant.now();
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

    public Long getIntegrationId() {
        return integrationId;
    }

    public void setIntegrationId(Long integrationId) {
        this.integrationId = integrationId;
    }

    public Long getTradeId() {
        return tradeId;
    }

    public void setTradeId(Long tradeId) {
        this.tradeId = tradeId;
    }

    public Long getExternalDealTicket() {
        return externalDealTicket;
    }

    public void setExternalDealTicket(Long externalDealTicket) {
        this.externalDealTicket = externalDealTicket;
    }

    public Long getExternalPositionId() {
        return externalPositionId;
    }

    public void setExternalPositionId(Long externalPositionId) {
        this.externalPositionId = externalPositionId;
    }

    public Long getExternalOrderTicket() {
        return externalOrderTicket;
    }

    public void setExternalOrderTicket(Long externalOrderTicket) {
        this.externalOrderTicket = externalOrderTicket;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getDealType() {
        return dealType;
    }

    public void setDealType(String dealType) {
        this.dealType = dealType;
    }

    public String getEntryType() {
        return entryType;
    }

    public void setEntryType(String entryType) {
        this.entryType = entryType;
    }

    public BigDecimal getVolume() {
        return volume;
    }

    public void setVolume(BigDecimal volume) {
        this.volume = volume;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Instant getDealTime() {
        return dealTime;
    }

    public void setDealTime(Instant dealTime) {
        this.dealTime = dealTime;
    }

    public BigDecimal getProfit() {
        return profit;
    }

    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }

    public BigDecimal getCommission() {
        return commission;
    }

    public void setCommission(BigDecimal commission) {
        this.commission = commission;
    }

    public BigDecimal getSwap() {
        return swap;
    }

    public void setSwap(BigDecimal swap) {
        this.swap = swap;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public Integer getDealReason() {
        return dealReason;
    }

    public void setDealReason(Integer dealReason) {
        this.dealReason = dealReason;
    }

    public Long getMagicNumber() {
        return magicNumber;
    }

    public void setMagicNumber(Long magicNumber) {
        this.magicNumber = magicNumber;
    }

    public String getDealComment() {
        return dealComment;
    }

    public void setDealComment(String dealComment) {
        this.dealComment = dealComment;
    }

    public String getSourcePlatform() {
        return sourcePlatform;
    }

    public void setSourcePlatform(String sourcePlatform) {
        this.sourcePlatform = sourcePlatform;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
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
