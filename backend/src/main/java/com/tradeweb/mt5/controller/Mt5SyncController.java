package com.tradeweb.mt5.controller;

import com.tradeweb.mt5.dto.HeartbeatRequest;
import com.tradeweb.mt5.dto.SyncBatchRequest;
import com.tradeweb.mt5.dto.SyncBatchResponse;
import com.tradeweb.mt5.entity.Mt5Integration;
import com.tradeweb.mt5.filter.EaTokenAuthenticationFilter;
import com.tradeweb.mt5.service.Mt5SyncService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/mt5/sync")
public class Mt5SyncController {

    private final Mt5SyncService syncService;

    public Mt5SyncController(Mt5SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/batch")
    public ResponseEntity<SyncBatchResponse> syncBatch(
            @RequestAttribute(EaTokenAuthenticationFilter.INTEGRATION_ATTR) Mt5Integration integration,
            @Valid @RequestBody SyncBatchRequest request
    ) {
        SyncBatchResponse response = syncService.processBatch(integration, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(
            @RequestAttribute(EaTokenAuthenticationFilter.INTEGRATION_ATTR) Mt5Integration integration,
            @RequestBody HeartbeatRequest request
    ) {
        syncService.processHeartbeat(integration, request);
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "checkpoint", integration.getSyncCheckpoint() != null ? integration.getSyncCheckpoint().toString() : "null"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus(
            @RequestAttribute(EaTokenAuthenticationFilter.INTEGRATION_ATTR) Mt5Integration integration
    ) {
        return ResponseEntity.ok(Map.of(
                "status", integration.getConnectionStatus().name(),
                "checkpoint", integration.getSyncCheckpoint() != null ? integration.getSyncCheckpoint().toString() : "null",
                "totalDealsImported", integration.getTotalDealsImported()
        ));
    }
}
