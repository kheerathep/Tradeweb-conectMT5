package com.tradeweb.mt5.controller;

import com.tradeweb.common.util.SecurityUtils;
import com.tradeweb.mt5.dto.ConnectionResponse;
import com.tradeweb.mt5.entity.Mt5Deal;
import com.tradeweb.mt5.entity.SyncBatch;
import com.tradeweb.mt5.service.Mt5ConnectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mt5/connections")
public class Mt5ConnectionController {

    private final Mt5ConnectionService connectionService;

    public Mt5ConnectionController(Mt5ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping("/{tradingAccountId}")
    public ResponseEntity<ConnectionResponse> getConnection(@PathVariable Long tradingAccountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ConnectionResponse response = connectionService.getConnection(userId, tradingAccountId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{tradingAccountId}/token")
    public ResponseEntity<ConnectionResponse> generateOrRotateToken(@PathVariable Long tradingAccountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ConnectionResponse response = connectionService.createOrRotateToken(userId, tradingAccountId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{tradingAccountId}/disconnect")
    public ResponseEntity<ConnectionResponse> disconnect(@PathVariable Long tradingAccountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ConnectionResponse response = connectionService.disconnect(userId, tradingAccountId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tradingAccountId}/batches")
    public ResponseEntity<List<SyncBatch>> getRecentBatches(@PathVariable Long tradingAccountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<SyncBatch> batches = connectionService.getRecentBatches(userId, tradingAccountId);
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/{tradingAccountId}/deals")
    public ResponseEntity<List<Mt5Deal>> getSyncedDeals(@PathVariable Long tradingAccountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<Mt5Deal> deals = connectionService.getSyncedDeals(userId, tradingAccountId);
        return ResponseEntity.ok(deals);
    }
}
