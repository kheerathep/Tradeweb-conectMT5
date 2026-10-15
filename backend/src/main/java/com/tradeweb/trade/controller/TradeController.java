package com.tradeweb.trade.controller;

import com.tradeweb.common.util.SecurityUtils;
import com.tradeweb.trade.dto.CreateManualTradeRequest;
import com.tradeweb.trade.dto.TradeDetailDto;
import com.tradeweb.trade.dto.TradeDto;
import com.tradeweb.trade.dto.UpdateJournalRequest;
import com.tradeweb.trade.entity.TradeStatus;
import com.tradeweb.trade.service.TradeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    private final TradeService tradeService;
    private final com.tradeweb.trade.service.CsvTradeService csvTradeService;

    public TradeController(
            TradeService tradeService,
            com.tradeweb.trade.service.CsvTradeService csvTradeService
    ) {
        this.tradeService = tradeService;
        this.csvTradeService = csvTradeService;
    }

    @GetMapping
    public ResponseEntity<List<TradeDto>> getTrades(
            @RequestParam Long accountId,
            @RequestParam(required = false) TradeStatus status,
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTime
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TradeDto> trades = tradeService.getTrades(userId, accountId, status, symbol, fromTime, toTime);
        return ResponseEntity.ok(trades);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportTradesCsv(@RequestParam Long accountId) {
        Long userId = SecurityUtils.getCurrentUserId();
        String csvContent = csvTradeService.exportTradesToCsv(userId, accountId);
        byte[] bytes = csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"trades_account_" + accountId + ".csv\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }

    @PostMapping(value = "/import/csv", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.tradeweb.trade.dto.CsvImportResultDto> importTradesCsv(
            @RequestParam Long accountId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        com.tradeweb.trade.dto.CsvImportResultDto result = csvTradeService.importTradesFromCsv(userId, accountId, file);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TradeDetailDto> getTradeById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradeDetailDto detail = tradeService.getTradeById(userId, id);
        return ResponseEntity.ok(detail);
    }

    @PutMapping("/{id}/journal")
    public ResponseEntity<TradeDto> updateJournal(
            @PathVariable Long id,
            @Valid @RequestBody UpdateJournalRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradeDto updated = tradeService.updateJournal(userId, id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping
    public ResponseEntity<TradeDto> createManualTrade(
            @Valid @RequestBody CreateManualTradeRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradeDto created = tradeService.createManualTrade(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTrade(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        tradeService.deleteTrade(userId, id);
        return ResponseEntity.ok(Map.of("message", "Trade deleted successfully"));
    }
}
