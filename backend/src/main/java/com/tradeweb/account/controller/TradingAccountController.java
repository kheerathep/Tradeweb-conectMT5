package com.tradeweb.account.controller;

import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.dto.TradingAccountDto;
import com.tradeweb.account.dto.UpdateAccountRequest;
import com.tradeweb.account.service.TradingAccountService;
import com.tradeweb.common.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/accounts")
public class TradingAccountController {

    private final TradingAccountService tradingAccountService;

    public TradingAccountController(TradingAccountService tradingAccountService) {
        this.tradingAccountService = tradingAccountService;
    }

    @GetMapping
    public ResponseEntity<List<TradingAccountDto>> getAccounts() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TradingAccountDto> accounts = tradingAccountService.getAccountsForUser(userId);
        return ResponseEntity.ok(accounts);
    }

    @PostMapping
    public ResponseEntity<TradingAccountDto> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradingAccountDto created = tradingAccountService.createAccount(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TradingAccountDto> getAccountById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradingAccountDto account = tradingAccountService.getAccountById(id, userId);
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TradingAccountDto> updateAccount(
            @PathVariable Long id,
            @RequestBody UpdateAccountRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        TradingAccountDto updated = tradingAccountService.updateAccount(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> archiveAccount(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        tradingAccountService.archiveAccount(id, userId);
        return ResponseEntity.ok(Map.of("message", "Account archived successfully"));
    }
}
