package com.tradeweb.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.auth.dto.RegisterRequest;
import com.tradeweb.trade.dto.CreateManualTradeRequest;
import com.tradeweb.trade.dto.UpdateJournalRequest;
import com.tradeweb.trade.entity.EmotionAfter;
import com.tradeweb.trade.entity.EmotionBefore;
import com.tradeweb.trade.entity.TradeDirection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AnalyticsAndCsvIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userJwt;
    private Long tradingAccountId;

    @BeforeEach
    void setup() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerReq = new RegisterRequest(
                "analyst_" + uniqueSuffix + "@example.com",
                "analyst_" + uniqueSuffix,
                "StrongPassword123!",
                "Analyst " + uniqueSuffix,
                "UTC"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        userJwt = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("token").asText();

        CreateAccountRequest accountReq = new CreateAccountRequest(
                "Analytics Test Account",
                "IC Markets",
                "ICMarkets-Live",
                AccountType.PERSONAL,
                "USD",
                new BigDecimal("10000.00")
        );

        MvcResult accResult = mockMvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(accountReq)))
                .andExpect(status().isCreated())
                .andReturn();

        tradingAccountId = objectMapper.readTree(accResult.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void testAnalyticsCalculationsAndCsvFlow() throws Exception {
        // Trade 1: EURUSD, BUY, Win (London Session)
        CreateManualTradeRequest t1 = new CreateManualTradeRequest();
        t1.setTradingAccountId(tradingAccountId);
        t1.setSymbol("EURUSD");
        t1.setDirection(TradeDirection.BUY);
        t1.setTotalVolume(new BigDecimal("1.0"));
        t1.setEntryPrice(new BigDecimal("1.08000"));
        t1.setExitPrice(new BigDecimal("1.08300"));
        t1.setGrossPnl(new BigDecimal("300.00"));
        t1.setOpenedAt(Instant.parse("2026-10-12T09:00:00Z"));
        t1.setClosedAt(Instant.parse("2026-10-12T10:30:00Z"));
        t1.setSetupName("Breakout");

        MvcResult res1 = mockMvc.perform(post("/api/v1/trades")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(t1)))
                .andExpect(status().isCreated())
                .andReturn();
        long id1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asLong();

        UpdateJournalRequest j1 = new UpdateJournalRequest();
        j1.setEmotionBefore(EmotionBefore.CONFIDENT);
        j1.setEmotionAfter(EmotionAfter.SATISFIED);
        j1.setFollowedRules(true);
        j1.setMistakes("None");
        mockMvc.perform(put("/api/v1/trades/" + id1 + "/journal")
                .header("Authorization", "Bearer " + userJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(j1)));

        // Trade 2: EURUSD, SELL, Loss (London Session)
        CreateManualTradeRequest t2 = new CreateManualTradeRequest();
        t2.setTradingAccountId(tradingAccountId);
        t2.setSymbol("EURUSD");
        t2.setDirection(TradeDirection.SELL);
        t2.setTotalVolume(new BigDecimal("1.0"));
        t2.setEntryPrice(new BigDecimal("1.08300"));
        t2.setExitPrice(new BigDecimal("1.08400"));
        t2.setGrossPnl(new BigDecimal("-100.00"));
        t2.setOpenedAt(Instant.parse("2026-10-12T11:00:00Z"));
        t2.setClosedAt(Instant.parse("2026-10-12T12:00:00Z"));
        t2.setSetupName("Pullback");

        MvcResult res2 = mockMvc.perform(post("/api/v1/trades")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(t2)))
                .andExpect(status().isCreated())
                .andReturn();
        long id2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("id").asLong();

        UpdateJournalRequest j2 = new UpdateJournalRequest();
        j2.setEmotionBefore(EmotionBefore.ANXIOUS);
        j2.setEmotionAfter(EmotionAfter.FRUSTRATED);
        j2.setFollowedRules(true);
        j2.setMistakes("Early exit");
        mockMvc.perform(put("/api/v1/trades/" + id2 + "/journal")
                .header("Authorization", "Bearer " + userJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(j2)));

        // Trade 3: XAUUSD, BUY, Win (New York Session, Rule Violated)
        CreateManualTradeRequest t3 = new CreateManualTradeRequest();
        t3.setTradingAccountId(tradingAccountId);
        t3.setSymbol("XAUUSD");
        t3.setDirection(TradeDirection.BUY);
        t3.setTotalVolume(new BigDecimal("0.5"));
        t3.setEntryPrice(new BigDecimal("2650.00"));
        t3.setExitPrice(new BigDecimal("2658.00"));
        t3.setGrossPnl(new BigDecimal("400.00"));
        t3.setOpenedAt(Instant.parse("2026-10-12T15:00:00Z"));
        t3.setClosedAt(Instant.parse("2026-10-12T16:30:00Z"));
        t3.setSetupName("Breakout");

        MvcResult res3 = mockMvc.perform(post("/api/v1/trades")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(t3)))
                .andExpect(status().isCreated())
                .andReturn();
        long id3 = objectMapper.readTree(res3.getResponse().getContentAsString()).get("id").asLong();

        UpdateJournalRequest j3 = new UpdateJournalRequest();
        j3.setEmotionBefore(EmotionBefore.FOMO);
        j3.setEmotionAfter(EmotionAfter.RELIEVED);
        j3.setFollowedRules(false);
        j3.setMistakes("Overleveraged");
        mockMvc.perform(put("/api/v1/trades/" + id3 + "/journal")
                .header("Authorization", "Bearer " + userJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(j3)));

        // Trade 4: Open trade
        CreateManualTradeRequest t4 = new CreateManualTradeRequest();
        t4.setTradingAccountId(tradingAccountId);
        t4.setSymbol("GBPUSD");
        t4.setDirection(TradeDirection.BUY);
        t4.setTotalVolume(new BigDecimal("0.2"));
        t4.setEntryPrice(new BigDecimal("1.30000"));
        mockMvc.perform(post("/api/v1/trades")
                .header("Authorization", "Bearer " + userJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(t4)));

        // 1. Verify Analytics Report
        mockMvc.perform(get("/api/v1/analytics?accountId=" + tradingAccountId)
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performance.totalTrades", is(4)))
                .andExpect(jsonPath("$.performance.winningTrades", is(2)))
                .andExpect(jsonPath("$.performance.losingTrades", is(1)))
                .andExpect(jsonPath("$.performance.totalNetPnl", is(600.0)))
                .andExpect(jsonPath("$.performance.grossProfit", is(700.0)))
                .andExpect(jsonPath("$.performance.grossLoss", is(100.0)))
                .andExpect(jsonPath("$.performance.profitFactor", is(7.0)))
                .andExpect(jsonPath("$.performance.winRate", closeTo(66.67, 0.01)))
                .andExpect(jsonPath("$.bySymbol", hasSize(2))) // EURUSD, XAUUSD
                .andExpect(jsonPath("$.bySetup", hasSize(2))) // Breakout, Pullback
                .andExpect(jsonPath("$.byRuleCompliance", hasSize(2))) // Followed Rules, Rule Violated
                .andExpect(jsonPath("$.dailyPnl", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.equityCurve", hasSize(4))); // Start + 3 closed trades

        // 2. Verify CSV Export
        MvcResult exportRes = mockMvc.perform(get("/api/v1/trades/export/csv?accountId=" + tradingAccountId)
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", containsString("trades_account_" + tradingAccountId)))
                .andReturn();

        String csvText = exportRes.getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(csvText.contains("ID,Symbol,Direction"));
        org.junit.jupiter.api.Assertions.assertTrue(csvText.contains("EURUSD"));
        org.junit.jupiter.api.Assertions.assertTrue(csvText.contains("XAUUSD"));

        // 3. Verify CSV Import
        String importCsvContent = "Symbol,Direction,Volume,EntryPrice,ExitPrice,GrossPnL,Commission,Swap,NetPnL,OpenedAt,ClosedAt,Setup,Mistakes,EmotionBefore,EmotionAfter,FollowedRules,Rating,Notes\n" +
                "USDJPY,BUY,0.50,149.200,149.800,300.00,-3.50,0.00,296.50,2026-10-12T04:00:00Z,2026-10-12T06:00:00Z,Tokyo Range,None,CONFIDENT,SATISFIED,true,5,Imported from external journal\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "import_trades.csv",
                "text/csv",
                importCsvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/v1/trades/import/csv")
                        .file(csvFile)
                        .param("accountId", tradingAccountId.toString())
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importedCount", is(1)))
                .andExpect(jsonPath("$.skippedCount", is(0)));

        // Verify newly imported trade is visible in list
        mockMvc.perform(get("/api/v1/trades?accountId=" + tradingAccountId + "&symbol=USDJPY")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].symbol", is("USDJPY")))
                .andExpect(jsonPath("$[0].tradeSource", is("CSV_IMPORT")))
                .andExpect(jsonPath("$[0].netPnl", is(296.5)));
    }
}
