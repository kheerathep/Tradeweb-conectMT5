package com.tradeweb.trade.repository;

import com.tradeweb.trade.entity.Trade;
import com.tradeweb.trade.entity.TradeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    List<Trade> findByTradingAccountIdOrderByOpenedAtDesc(Long tradingAccountId);

    Page<Trade> findByTradingAccountId(Long tradingAccountId, Pageable pageable);

    Optional<Trade> findByTradingAccountIdAndExternalPositionId(Long tradingAccountId, Long externalPositionId);

    Optional<Trade> findByIdAndTradingAccountId(Long id, Long tradingAccountId);

    List<Trade> findByTradingAccountIdAndTradeStatus(Long tradingAccountId, TradeStatus status);

    long countByTradingAccountId(Long tradingAccountId);

    @Query("SELECT t FROM Trade t WHERE t.tradingAccountId = :accountId " +
           "AND (:status IS NULL OR t.tradeStatus = :status) " +
           "AND (:symbol IS NULL OR t.symbol = :symbol) " +
           "AND (:fromTime IS NULL OR t.openedAt >= :fromTime) " +
           "AND (:toTime IS NULL OR t.openedAt <= :toTime) " +
           "ORDER BY t.openedAt DESC")
    List<Trade> filterTrades(
            @Param("accountId") Long accountId,
            @Param("status") TradeStatus status,
            @Param("symbol") String symbol,
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );
}
