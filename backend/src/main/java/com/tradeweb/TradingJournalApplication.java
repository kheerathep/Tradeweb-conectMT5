package com.tradeweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TradingJournalApplication {

    public static void main(String[] args) {
        // Enforce UTC timezone globally
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(TradingJournalApplication.class, args);
    }
}
