package com.tradeweb.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final DataSource dataSource;

    @Autowired
    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "trading-journal-backend");
        health.put("version", "1.0.0");
        health.put("timestamp", Instant.now().toString());

        boolean dbOk = false;
        String dbError = null;
        try (Connection conn = dataSource.getConnection()) {
            dbOk = conn.isValid(2);
        } catch (Exception e) {
            dbError = e.getMessage();
        }

        Map<String, Object> components = new HashMap<>();
        Map<String, Object> dbStatus = new HashMap<>();
        dbStatus.put("status", dbOk ? "UP" : "DOWN");
        if (dbError != null) {
            dbStatus.put("error", dbError);
        }
        components.put("database", dbStatus);
        health.put("components", components);

        return ResponseEntity.ok(health);
    }
}
