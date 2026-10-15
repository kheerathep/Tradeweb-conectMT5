package com.tradeweb.trade.service;

import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.common.exception.ResourceNotFoundException;
import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.mt5.repository.Mt5DealRepository;
import com.tradeweb.trade.dto.CreateManualTradeRequest;
import com.tradeweb.trade.dto.TradeDetailDto;
import com.tradeweb.trade.dto.TradeDto;
import com.tradeweb.trade.dto.UpdateJournalRequest;
import com.tradeweb.trade.entity.Trade;
import com.tradeweb.trade.entity.TradeSource;
import com.tradeweb.trade.entity.TradeStatus;
import com.tradeweb.trade.repository.TradeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;
    private final TradingAccountRepository tradingAccountRepository;
    private final Mt5DealRepository dealRepository;

    public TradeService(
            TradeRepository tradeRepository,
            TradingAccountRepository tradingAccountRepository,
            Mt5DealRepository dealRepository
    ) {
        this.tradeRepository = tradeRepository;
        this.tradingAccountRepository = tradingAccountRepository;
        this.dealRepository = dealRepository;
    }

    @Transactional(readOnly = true)
    public List<TradeDto> getTrades(
            Long userId,
            Long accountId,
            TradeStatus status,
            String symbol,
            Instant fromTime,
            Instant toTime
    ) {
        verifyAccountOwnership(userId, accountId);
        List<Trade> trades = tradeRepository.filterTrades(accountId, status, symbol, fromTime, toTime);
        return trades.stream().map(TradeDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TradeDetailDto getTradeById(Long userId, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found with ID: " + tradeId));
        verifyAccountOwnership(userId, trade.getTradingAccountId());

        List<Mt5Deal> deals = dealRepository.findByTradeIdOrderByDealTimeAsc(tradeId);
        return new TradeDetailDto(trade, deals);
    }

    @Transactional
    public TradeDto updateJournal(Long userId, Long tradeId, UpdateJournalRequest request) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found with ID: " + tradeId));
        verifyAccountOwnership(userId, trade.getTradingAccountId());

        if (request.getSetupName() != null) trade.setSetupName(request.getSetupName());
        if (request.getEntryReason() != null) trade.setEntryReason(request.getEntryReason());
        if (request.getExitReason() != null) trade.setExitReason(request.getExitReason());
        if (request.getNotes() != null) trade.setNotes(request.getNotes());
        if (request.getEmotionBefore() != null) trade.setEmotionBefore(request.getEmotionBefore());
        if (request.getEmotionAfter() != null) trade.setEmotionAfter(request.getEmotionAfter());
        if (request.getFollowedRules() != null) trade.setFollowedRules(request.getFollowedRules());
        if (request.getMistakes() != null) trade.setMistakes(request.getMistakes());
        if (request.getPostTradeReview() != null) trade.setPostTradeReview(request.getPostTradeReview());
        if (request.getRating() != null) trade.setRating(request.getRating());

        if (request.getRiskAmount() != null && request.getRiskAmount().compareTo(BigDecimal.ZERO) > 0) {
            trade.setRiskAmount(request.getRiskAmount());
            if (trade.getNetPnl() != null) {
                BigDecimal rMult = trade.getNetPnl().divide(request.getRiskAmount(), 4, RoundingMode.HALF_UP);
                trade.setRMultiple(rMult);
            }
        }

        Trade saved = tradeRepository.save(trade);
        return TradeDto.fromEntity(saved);
    }

    @Transactional
    public TradeDto createManualTrade(Long userId, CreateManualTradeRequest request) {
        verifyAccountOwnership(userId, request.getTradingAccountId());

        Trade trade = new Trade(request.getTradingAccountId(), request.getSymbol(), request.getDirection(), TradeSource.MANUAL);
        trade.setEntryPrice(request.getEntryPrice());
        trade.setExitPrice(request.getExitPrice());
        trade.setTotalVolume(request.getTotalVolume());
        trade.setOpenedAt(request.getOpenedAt() != null ? request.getOpenedAt() : Instant.now());
        trade.setClosedAt(request.getClosedAt());
        trade.setSetupName(request.getSetupName());
        trade.setNotes(request.getNotes());

        if (request.getExitPrice() != null || request.getClosedAt() != null) {
            trade.setTradeStatus(TradeStatus.CLOSED);
            trade.setClosedVolume(request.getTotalVolume());
            trade.setRemainingVolume(BigDecimal.ZERO);
        } else {
            trade.setTradeStatus(TradeStatus.OPEN);
            trade.setRemainingVolume(request.getTotalVolume());
            trade.setClosedVolume(BigDecimal.ZERO);
        }

        BigDecimal gross = request.getGrossPnl() != null ? request.getGrossPnl() : BigDecimal.ZERO;
        BigDecimal comm = request.getCommissionTotal() != null ? request.getCommissionTotal() : BigDecimal.ZERO;
        BigDecimal swap = request.getSwapTotal() != null ? request.getSwapTotal() : BigDecimal.ZERO;

        trade.setGrossPnl(gross);
        trade.setCommissionTotal(comm);
        trade.setSwapTotal(swap);
        trade.setNetPnl(gross.add(comm).add(swap));

        Trade saved = tradeRepository.save(trade);
        return TradeDto.fromEntity(saved);
    }

    @Transactional
    public void deleteTrade(Long userId, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found with ID: " + tradeId));
        verifyAccountOwnership(userId, trade.getTradingAccountId());
        tradeRepository.delete(trade);
    }

    private void verifyAccountOwnership(Long userId, Long accountId) {
        tradingAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));
    }
}
