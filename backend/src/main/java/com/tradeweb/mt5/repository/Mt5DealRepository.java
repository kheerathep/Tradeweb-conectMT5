package com.tradeweb.mt5.repository;

import com.tradeweb.mt5.entity.Mt5Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Mt5DealRepository extends JpaRepository<Mt5Deal, Long> {
    Optional<Mt5Deal> findByIntegrationIdAndExternalDealTicket(Long integrationId, Long externalDealTicket);
    boolean existsByIntegrationIdAndExternalDealTicket(Long integrationId, Long externalDealTicket);
    List<Mt5Deal> findByIntegrationIdOrderByDealTimeDesc(Long integrationId);
    List<Mt5Deal> findByTradeIdOrderByDealTimeAsc(Long tradeId);
    long countByIntegrationId(Long integrationId);
}
