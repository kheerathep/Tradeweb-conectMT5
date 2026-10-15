package com.tradeweb.mt5.service;

import com.tradeweb.account.entity.TradingAccount;
import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.common.exception.ResourceNotFoundException;
import com.tradeweb.mt5.dto.ConnectionResponse;
import com.tradeweb.mt5.entity.ConnectionStatus;
import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.mt5.entity.Mt5Integration;
import com.tradeweb.mt5.entity.SyncBatch;
import com.tradeweb.mt5.repository.Mt5DealRepository;
import com.tradeweb.mt5.repository.Mt5IntegrationRepository;
import com.tradeweb.mt5.repository.SyncBatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class Mt5ConnectionService {

    private final Mt5IntegrationRepository integrationRepository;
    private final TradingAccountRepository tradingAccountRepository;
    private final Mt5DealRepository dealRepository;
    private final SyncBatchRepository batchRepository;
    private final Mt5TokenService tokenService;

    public Mt5ConnectionService(
            Mt5IntegrationRepository integrationRepository,
            TradingAccountRepository tradingAccountRepository,
            Mt5DealRepository dealRepository,
            SyncBatchRepository batchRepository,
            Mt5TokenService tokenService
    ) {
        this.integrationRepository = integrationRepository;
        this.tradingAccountRepository = tradingAccountRepository;
        this.dealRepository = dealRepository;
        this.batchRepository = batchRepository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public ConnectionResponse getConnection(Long userId, Long tradingAccountId) {
        verifyAccountOwnership(userId, tradingAccountId);
        Mt5Integration integration = integrationRepository.findByTradingAccountId(tradingAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("MT5 connection not found for trading account ID: " + tradingAccountId));
        return ConnectionResponse.fromEntity(integration, null);
    }

    @Transactional
    public ConnectionResponse createOrRotateToken(Long userId, Long tradingAccountId) {
        verifyAccountOwnership(userId, tradingAccountId);

        String rawToken = tokenService.generateToken();
        String tokenHash = tokenService.hashToken(rawToken);
        String tokenPrefix = tokenService.extractPrefix(rawToken);

        Mt5Integration integration = integrationRepository.findByTradingAccountId(tradingAccountId)
                .orElseGet(() -> new Mt5Integration(tradingAccountId, tokenHash, tokenPrefix));

        integration.setTokenHash(tokenHash);
        integration.setTokenPrefix(tokenPrefix);
        integration.setTokenCreatedAt(Instant.now());
        integration.setTokenRevokedAt(null);
        integration.setConnectionStatus(ConnectionStatus.PENDING);

        Mt5Integration saved = integrationRepository.save(integration);
        return ConnectionResponse.fromEntity(saved, rawToken);
    }

    @Transactional
    public ConnectionResponse disconnect(Long userId, Long tradingAccountId) {
        verifyAccountOwnership(userId, tradingAccountId);
        Mt5Integration integration = integrationRepository.findByTradingAccountId(tradingAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("MT5 connection not found for trading account ID: " + tradingAccountId));

        integration.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        integration.setTokenRevokedAt(Instant.now());
        Mt5Integration saved = integrationRepository.save(integration);
        return ConnectionResponse.fromEntity(saved, null);
    }

    @Transactional(readOnly = true)
    public List<SyncBatch> getRecentBatches(Long userId, Long tradingAccountId) {
        verifyAccountOwnership(userId, tradingAccountId);
        Mt5Integration integration = integrationRepository.findByTradingAccountId(tradingAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("MT5 connection not found for trading account ID: " + tradingAccountId));
        return batchRepository.findByIntegrationIdOrderByReceivedAtDesc(integration.getId());
    }

    @Transactional(readOnly = true)
    public List<Mt5Deal> getSyncedDeals(Long userId, Long tradingAccountId) {
        verifyAccountOwnership(userId, tradingAccountId);
        Mt5Integration integration = integrationRepository.findByTradingAccountId(tradingAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("MT5 connection not found for trading account ID: " + tradingAccountId));
        return dealRepository.findByIntegrationIdOrderByDealTimeDesc(integration.getId());
    }

    private TradingAccount verifyAccountOwnership(Long userId, Long tradingAccountId) {
        return tradingAccountRepository.findByIdAndUserId(tradingAccountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));
    }
}
