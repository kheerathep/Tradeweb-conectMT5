package com.tradeweb.trade.dto;

import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.trade.entity.Trade;

import java.util.ArrayList;
import java.util.List;

public class TradeDetailDto {

    private TradeDto trade;
    private List<Mt5Deal> deals = new ArrayList<>();

    public TradeDetailDto() {}

    public TradeDetailDto(Trade trade, List<Mt5Deal> deals) {
        this.trade = TradeDto.fromEntity(trade);
        this.deals = deals != null ? deals : new ArrayList<>();
    }

    public TradeDto getTrade() {
        return trade;
    }

    public void setTrade(TradeDto trade) {
        this.trade = trade;
    }

    public List<Mt5Deal> getDeals() {
        return deals;
    }

    public void setDeals(List<Mt5Deal> deals) {
        this.deals = deals;
    }
}
