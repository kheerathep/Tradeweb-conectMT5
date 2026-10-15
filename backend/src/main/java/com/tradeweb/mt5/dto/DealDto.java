package com.tradeweb.mt5.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class DealDto {

    @NotNull(message = "Deal ticket is required")
    private Long ticket;

    private Long positionId;
    private Long orderTicket;
    private String symbol;

    @NotNull(message = "Deal type is required")
    private String dealType;

    private String entryType;

    @NotNull(message = "Deal volume is required")
    private BigDecimal volume;

    @NotNull(message = "Deal price is required")
    private BigDecimal price;

    @NotNull(message = "Deal time is required")
    private Instant dealTime;

    private BigDecimal profit = BigDecimal.ZERO;
    private BigDecimal commission = BigDecimal.ZERO;
    private BigDecimal swap = BigDecimal.ZERO;
    private BigDecimal fee = BigDecimal.ZERO;
    private Integer reason;
    private Long magicNumber;
    private String comment;

    public DealDto() {}

    public Long getTicket() {
        return ticket;
    }

    public void setTicket(Long ticket) {
        this.ticket = ticket;
    }

    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
    }

    public Long getOrderTicket() {
        return orderTicket;
    }

    public void setOrderTicket(Long orderTicket) {
        this.orderTicket = orderTicket;
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

    public Integer getReason() {
        return reason;
    }

    public void setReason(Integer reason) {
        this.reason = reason;
    }

    public Long getMagicNumber() {
        return magicNumber;
    }

    public void setMagicNumber(Long magicNumber) {
        this.magicNumber = magicNumber;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
