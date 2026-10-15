package com.tradeweb.account.service;

import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.dto.TradingAccountDto;
import com.tradeweb.account.dto.UpdateAccountRequest;
import com.tradeweb.account.entity.AccountStatus;
import com.tradeweb.account.entity.TradingAccount;
import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TradingAccountService {

    private final TradingAccountRepository tradingAccountRepository;

    public TradingAccountService(TradingAccountRepository tradingAccountRepository) {
        this.tradingAccountRepository = tradingAccountRepository;
    }

    @Transactional(readOnly = true)
    public List<TradingAccountDto> getAccountsForUser(Long userId) {
        return tradingAccountRepository.findByUserIdAndStatus(userId, AccountStatus.ACTIVE)
                .stream()
                .map(TradingAccountDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TradingAccountDto getAccountById(Long id, Long userId) {
        TradingAccount account = tradingAccountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));
        return TradingAccountDto.fromEntity(account);
    }

    @Transactional
    public TradingAccountDto createAccount(CreateAccountRequest request, Long userId) {
        TradingAccount account = new TradingAccount(
                userId,
                request.getAccountName(),
                request.getBroker(),
                request.getMt5Server(),
                request.getAccountType(),
                request.getCurrency(),
                request.getInitialBalance(),
                AccountStatus.ACTIVE
        );
        TradingAccount saved = tradingAccountRepository.save(account);
        return TradingAccountDto.fromEntity(saved);
    }

    @Transactional
    public TradingAccountDto updateAccount(Long id, UpdateAccountRequest request, Long userId) {
        TradingAccount account = tradingAccountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));

        if (request.getAccountName() != null) {
            account.setAccountName(request.getAccountName());
        }
        if (request.getBroker() != null) {
            account.setBroker(request.getBroker());
        }
        if (request.getMt5Server() != null) {
            account.setMt5Server(request.getMt5Server());
        }
        if (request.getAccountType() != null) {
            account.setAccountType(request.getAccountType());
        }
        if (request.getInitialBalance() != null) {
            account.setInitialBalance(request.getInitialBalance());
        }
        if (request.getStatus() != null) {
            account.setStatus(request.getStatus());
        }

        TradingAccount updated = tradingAccountRepository.save(account);
        return TradingAccountDto.fromEntity(updated);
    }

    @Transactional
    public void archiveAccount(Long id, Long userId) {
        TradingAccount account = tradingAccountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));
        account.setStatus(AccountStatus.ARCHIVED);
        tradingAccountRepository.save(account);
    }
}
