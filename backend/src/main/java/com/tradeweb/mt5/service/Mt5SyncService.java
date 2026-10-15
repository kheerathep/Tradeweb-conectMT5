package com.tradeweb.mt5.service;

import com.tradeweb.account.entity.TradingAccount;
import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.mt5.dto.DealDto;
import com.tradeweb.mt5.dto.HeartbeatRequest;
import com.tradeweb.mt5.dto.SyncBatchRequest;
import com.tradeweb.mt5.dto.SyncBatchResponse;
import com.tradeweb.mt5.entity.ConnectionStatus;
import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.mt5.entity.Mt5Integration;
import com.tradeweb.mt5.entity.SyncBatch;
import com.tradeweb.mt5.repository.Mt5DealRepository;
import com.tradeweb.mt5.repository.Mt5IntegrationRepository;
import com.tradeweb.mt5.repository.SyncBatchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class Mt5SyncService {

    private static final Logger log = LoggerFactory.getLogger(Mt5SyncService.class);

    private final Mt5IntegrationRepository integrationRepository;
    private final Mt5DealRepository dealRepository;
    private final SyncBatchRepository batchRepository;
    private final TradingAccountRepository tradingAccountRepository;
    private final Mt5TokenService tokenService;
    private final com.tradeweb.trade.service.TradeNormalizationService tradeNormalizationService;
    private final com.tradeweb.trade.repository.TradeRepository tradeRepository;

    public Mt5SyncService(
            Mt5IntegrationRepository integrationRepository,
            Mt5DealRepository dealRepository,
            SyncBatchRepository batchRepository,
            TradingAccountRepository tradingAccountRepository,
            Mt5TokenService tokenService,
            com.tradeweb.trade.service.TradeNormalizationService tradeNormalizationService,
            com.tradeweb.trade.repository.TradeRepository tradeRepository
    ) {
        this.integrationRepository = integrationRepository;
        this.dealRepository = dealRepository;
        this.batchRepository = batchRepository;
        this.tradingAccountRepository = tradingAccountRepository;
        this.tokenService = tokenService;
        this.tradeNormalizationService = tradeNormalizationService;
        this.tradeRepository = tradeRepository;
    }

    public Optional<Mt5Integration> authenticateToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return Optional.empty();
        }
        String tokenHash = tokenService.hashToken(rawToken.trim());
        Optional<Mt5Integration> integrationOpt = integrationRepository.findByTokenHash(tokenHash);
        if (integrationOpt.isPresent() && integrationOpt.get().isTokenActive()) {
            return integrationOpt;
        }
        return Optional.empty();
    }

    @Transactional
    public SyncBatchResponse processBatch(Mt5Integration integration, SyncBatchRequest request) {
        List<DealDto> deals = request.getDeals() != null ? request.getDeals() : new ArrayList<>();
        Instant checkpointBefore = integration.getSyncCheckpoint();

        SyncBatch batch = new SyncBatch();
        batch.setIntegrationId(integration.getId());
        batch.setBatchId(request.getBatchId());
        batch.setRecordsReceived(deals.size());
        batch.setCheckpointBefore(checkpointBefore);
        batch.setReceivedAt(Instant.now());

        int inserted = 0;
        int duplicated = 0;
        int rejected = 0;
        List<String> rejectionReasons = new ArrayList<>();
        Instant maxDealTime = null;

        for (DealDto deal : deals) {
            // Validation
            if (deal.getTicket() == null) {
                rejected++;
                rejectionReasons.add("Missing deal ticket");
                continue;
            }
            if (deal.getDealType() == null || deal.getDealType().trim().isEmpty()) {
                rejected++;
                rejectionReasons.add("Ticket " + deal.getTicket() + ": missing dealType");
                continue;
            }
            if (deal.getVolume() == null || deal.getVolume().compareTo(BigDecimal.ZERO) < 0) {
                rejected++;
                rejectionReasons.add("Ticket " + deal.getTicket() + ": invalid volume");
                continue;
            }
            if (deal.getPrice() == null || deal.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                rejected++;
                rejectionReasons.add("Ticket " + deal.getTicket() + ": invalid price");
                continue;
            }
            if (deal.getDealTime() == null) {
                rejected++;
                rejectionReasons.add("Ticket " + deal.getTicket() + ": missing dealTime");
                continue;
            }

            // Deduplication check
            if (dealRepository.existsByIntegrationIdAndExternalDealTicket(integration.getId(), deal.getTicket())) {
                duplicated++;
                if (maxDealTime == null || deal.getDealTime().isAfter(maxDealTime)) {
                    maxDealTime = deal.getDealTime();
                }
                continue;
            }

            // Ingestion
            Mt5Deal entity = new Mt5Deal(
                    integration.getId(),
                    deal.getTicket(),
                    deal.getPositionId(),
                    deal.getOrderTicket(),
                    deal.getSymbol(),
                    deal.getDealType(),
                    deal.getEntryType(),
                    deal.getVolume(),
                    deal.getPrice(),
                    deal.getDealTime(),
                    deal.getProfit(),
                    deal.getCommission(),
                    deal.getSwap(),
                    deal.getFee(),
                    deal.getReason(),
                    deal.getMagicNumber(),
                    deal.getComment()
            );

            Mt5Deal savedDeal = dealRepository.save(entity);
            tradeNormalizationService.normalizeDeal(integration.getTradingAccountId(), savedDeal);
            dealRepository.save(savedDeal); // persist tradeId update
            inserted++;

            if (maxDealTime == null || deal.getDealTime().isAfter(maxDealTime)) {
                maxDealTime = deal.getDealTime();
            }
        }

        // Checkpoint resolution
        Instant newCheckpoint = checkpointBefore;
        if (request.getCheckpoint() != null) {
            newCheckpoint = request.getCheckpoint();
        } else if (maxDealTime != null) {
            if (newCheckpoint == null || maxDealTime.isAfter(newCheckpoint)) {
                newCheckpoint = maxDealTime;
            }
        }

        // Update integration state
        integration.setConnectionStatus(ConnectionStatus.CONNECTED);
        integration.setLastSyncSuccessAt(Instant.now());
        integration.setTotalDealsImported(integration.getTotalDealsImported() + inserted);
        integration.setTotalTradesNormalized(tradeRepository.countByTradingAccountId(integration.getTradingAccountId()));
        integration.setSyncCheckpoint(newCheckpoint);

        if (request.getAccountInfo() != null) {
            if (request.getAccountInfo().getBalance() != null) {
                integration.setMt5Balance(request.getAccountInfo().getBalance());
            }
            if (request.getAccountInfo().getEquity() != null) {
                integration.setMt5Equity(request.getAccountInfo().getEquity());
            }
            if (request.getAccountInfo().getCurrency() != null) {
                integration.setMt5Currency(request.getAccountInfo().getCurrency());
            }
            if (request.getAccountInfo().getAccountName() != null) {
                integration.setMt5AccountName(request.getAccountInfo().getAccountName());
            }
            if (request.getAccountInfo().getCompany() != null) {
                integration.setMt5Company(request.getAccountInfo().getCompany());
            }
            if (request.getAccountInfo().getServer() != null) {
                integration.setMt5Server(request.getAccountInfo().getServer());
            }
            integration.setLastHeartbeatAt(Instant.now());
        }

        integrationRepository.save(integration);

        // Record audit batch
        batch.setRecordsInserted(inserted);
        batch.setRecordsDuplicated(duplicated);
        batch.setRecordsRejected(rejected);
        if (!rejectionReasons.isEmpty()) {
            batch.setRejectionDetails(String.join("; ", rejectionReasons));
        }
        batch.setCheckpointAfter(newCheckpoint);
        batch.setHttpStatus(200);
        batch.setProcessedAt(Instant.now());
        batchRepository.save(batch);

        SyncBatchResponse response = new SyncBatchResponse(request.getBatchId(), deals.size(), inserted, duplicated, rejected);
        response.setRejectionReasons(rejectionReasons);
        response.setNewCheckpoint(newCheckpoint);

        log.info("MT5 Batch {} for integration {}: {} received, {} inserted, {} duplicated, {} rejected",
                request.getBatchId(), integration.getId(), deals.size(), inserted, duplicated, rejected);

        return response;
    }

    @Transactional
    public void processHeartbeat(Mt5Integration integration, HeartbeatRequest request) {
        integration.setConnectionStatus(ConnectionStatus.CONNECTED);
        integration.setLastHeartbeatAt(Instant.now());

        if (request.getBalance() != null) {
            integration.setMt5Balance(request.getBalance());
        }
        if (request.getEquity() != null) {
            integration.setMt5Equity(request.getEquity());
        }
        if (request.getCurrency() != null) {
            integration.setMt5Currency(request.getCurrency());
        }
        if (request.getAccountName() != null) {
            integration.setMt5AccountName(request.getAccountName());
        }
        if (request.getCompany() != null) {
            integration.setMt5Company(request.getCompany());
        }
        if (request.getServer() != null) {
            integration.setMt5Server(request.getServer());
        }

        integrationRepository.save(integration);
    }
}
