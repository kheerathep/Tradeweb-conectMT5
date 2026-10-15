package com.tradeweb.mt5.repository;

import com.tradeweb.mt5.entity.Mt5Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface Mt5IntegrationRepository extends JpaRepository<Mt5Integration, Long> {
    Optional<Mt5Integration> findByTradingAccountId(Long tradingAccountId);
    Optional<Mt5Integration> findByTokenHash(String tokenHash);
}
