package com.tradeweb.trade.service;

import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.trade.entity.Trade;
import com.tradeweb.trade.entity.TradeDirection;
import com.tradeweb.trade.entity.TradeSource;
import com.tradeweb.trade.entity.TradeStatus;
import com.tradeweb.trade.repository.TradeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
public class TradeNormalizationService {

    private static final Logger log = LoggerFactory.getLogger(TradeNormalizationService.class);

    private final TradeRepository tradeRepository;

    public TradeNormalizationService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    @Transactional
    public Trade normalizeDeal(Long tradingAccountId, Mt5Deal deal) {
        if (deal == null || deal.getExternalPositionId() == null) {
            return null;
        }

        String dealType = deal.getDealType() != null ? deal.getDealType() : "";
        if (!dealType.contains("BUY") && !dealType.contains("SELL")) {
            // Non-trading deal (e.g. balance, credit, bonus)
            return null;
        }

        Long positionId = deal.getExternalPositionId();
        String entryType = deal.getEntryType() != null ? deal.getEntryType() : "";

        Optional<Trade> existingTradeOpt = tradeRepository.findByTradingAccountIdAndExternalPositionId(tradingAccountId, positionId);

        Trade trade;
        if (existingTradeOpt.isPresent()) {
            trade = existingTradeOpt.get();
        } else {
            trade = new Trade();
            trade.setTradingAccountId(tradingAccountId);
            trade.setExternalPositionId(positionId);
            trade.setSymbol(deal.getSymbol());
            trade.setTradeSource(TradeSource.MT5_SYNC);

            if (entryType.contains("OUT")) {
                // Closed deal without matching entry in window: direction is opposite of exit
                trade.setDirection(dealType.contains("BUY") ? TradeDirection.SELL : TradeDirection.BUY);
                trade.setTradeStatus(TradeStatus.CLOSED);
                trade.setOpenedAt(deal.getDealTime());
            } else {
                trade.setDirection(dealType.contains("BUY") ? TradeDirection.BUY : TradeDirection.SELL);
                trade.setTradeStatus(TradeStatus.OPEN);
                trade.setOpenedAt(deal.getDealTime());
            }
        }

        BigDecimal volume = deal.getVolume() != null ? deal.getVolume() : BigDecimal.ZERO;
        BigDecimal price = deal.getPrice() != null ? deal.getPrice() : BigDecimal.ZERO;
        BigDecimal profit = deal.getProfit() != null ? deal.getProfit() : BigDecimal.ZERO;
        BigDecimal commission = deal.getCommission() != null ? deal.getCommission() : BigDecimal.ZERO;
        BigDecimal swap = deal.getSwap() != null ? deal.getSwap() : BigDecimal.ZERO;
        BigDecimal fee = deal.getFee() != null ? deal.getFee() : BigDecimal.ZERO;

        if (entryType.contains("IN") && !entryType.contains("OUT")) {
            // Opening or scaling into position
            if (trade.getEntryPrice() == null || trade.getTotalVolume().compareTo(BigDecimal.ZERO) == 0) {
                trade.setEntryPrice(price);
                trade.setTotalVolume(volume);
                trade.setRemainingVolume(volume);
            } else {
                // Weighted average entry price
                BigDecimal currentTotalVal = trade.getEntryPrice().multiply(trade.getTotalVolume());
                BigDecimal newDealVal = price.multiply(volume);
                BigDecimal newTotalVol = trade.getTotalVolume().add(volume);
                if (newTotalVol.compareTo(BigDecimal.ZERO) > 0) {
                    trade.setEntryPrice(currentTotalVal.add(newDealVal).divide(newTotalVol, 8, RoundingMode.HALF_UP));
                }
                trade.setTotalVolume(newTotalVol);
                trade.setRemainingVolume(trade.getRemainingVolume().add(volume));
            }

            if (trade.getOpenedAt() == null || (deal.getDealTime() != null && deal.getDealTime().isBefore(trade.getOpenedAt()))) {
                trade.setOpenedAt(deal.getDealTime());
            }
        } else {
            // Closing or partially closing position (ENTRY_OUT or ENTRY_INOUT)
            BigDecimal prevClosedVol = trade.getClosedVolume() != null ? trade.getClosedVolume() : BigDecimal.ZERO;
            BigDecimal newClosedVol = prevClosedVol.add(volume);

            if (trade.getExitPrice() == null || prevClosedVol.compareTo(BigDecimal.ZERO) == 0) {
                trade.setExitPrice(price);
            } else {
                // Weighted average exit price
                BigDecimal currentExitVal = trade.getExitPrice().multiply(prevClosedVol);
                BigDecimal newExitVal = price.multiply(volume);
                if (newClosedVol.compareTo(BigDecimal.ZERO) > 0) {
                    trade.setExitPrice(currentExitVal.add(newExitVal).divide(newClosedVol, 8, RoundingMode.HALF_UP));
                }
            }

            trade.setClosedVolume(newClosedVol);

            if (trade.getTotalVolume().compareTo(BigDecimal.ZERO) == 0) {
                trade.setTotalVolume(newClosedVol);
                trade.setEntryPrice(price);
            }

            BigDecimal remaining = trade.getTotalVolume().subtract(newClosedVol);
            trade.setRemainingVolume(remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining);

            if (trade.getRemainingVolume().compareTo(BigDecimal.ZERO) <= 0) {
                trade.setTradeStatus(TradeStatus.CLOSED);
            } else {
                trade.setTradeStatus(TradeStatus.PARTIALLY_CLOSED);
            }

            trade.setClosedAt(deal.getDealTime());
        }

        // Accumulate financial metrics
        BigDecimal prevGross = trade.getGrossPnl() != null ? trade.getGrossPnl() : BigDecimal.ZERO;
        trade.setGrossPnl(prevGross.add(profit));

        BigDecimal prevComm = trade.getCommissionTotal() != null ? trade.getCommissionTotal() : BigDecimal.ZERO;
        trade.setCommissionTotal(prevComm.add(commission));

        BigDecimal prevSwap = trade.getSwapTotal() != null ? trade.getSwapTotal() : BigDecimal.ZERO;
        trade.setSwapTotal(prevSwap.add(swap));

        BigDecimal prevFee = trade.getFeeTotal() != null ? trade.getFeeTotal() : BigDecimal.ZERO;
        trade.setFeeTotal(prevFee.add(fee));

        BigDecimal netPnl = trade.getGrossPnl()
                .add(trade.getCommissionTotal())
                .add(trade.getSwapTotal())
                .add(trade.getFeeTotal());
        trade.setNetPnl(netPnl);

        Trade savedTrade = tradeRepository.save(trade);
        deal.setTradeId(savedTrade.getId());

        log.debug("Normalized Deal {} into Trade {} (Status: {}, NetPnL: {})",
                deal.getExternalDealTicket(), savedTrade.getId(), savedTrade.getTradeStatus(), savedTrade.getNetPnl());

        return savedTrade;
    }
}
