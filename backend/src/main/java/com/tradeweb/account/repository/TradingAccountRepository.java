package com.tradeweb.account.repository;

import com.tradeweb.account.entity.AccountStatus;
import com.tradeweb.account.entity.TradingAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TradingAccountRepository extends JpaRepository<TradingAccount, Long> {
    List<TradingAccount> findByUserIdAndStatus(Long userId, AccountStatus status);
    List<TradingAccount> findByUserId(Long userId);
    Optional<TradingAccount> findByIdAndUserId(Long id, Long userId);
}
