package com.tradeweb.analytics.controller;

import com.tradeweb.analytics.dto.AnalyticsReportDto;
import com.tradeweb.analytics.service.AnalyticsService;
import com.tradeweb.common.util.SecurityUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<AnalyticsReportDto> getAnalytics(
            @RequestParam Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTime
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        AnalyticsReportDto report = analyticsService.getAnalyticsReport(userId, accountId, fromTime, toTime);
        return ResponseEntity.ok(report);
    }
}
