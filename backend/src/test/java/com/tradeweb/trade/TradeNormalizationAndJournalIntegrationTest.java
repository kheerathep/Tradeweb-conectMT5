package com.tradeweb.trade;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.auth.dto.RegisterRequest;
import com.tradeweb.mt5.dto.DealDto;
import com.tradeweb.mt5.dto.SyncBatchRequest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TradeNormalizationAndJournalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userJwt;
    private Long tradingAccountId;
    private String eaToken;

    @BeforeEach
    void setup() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerReq = new RegisterRequest(
                "trader_" + uniqueSuffix + "@example.com",
                "trader_" + uniqueSuffix,
                "StrongPassword123!",
                "Trader " + uniqueSuffix,
                "UTC"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        userJwt = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("token").asText();

        CreateAccountRequest accountReq = new CreateAccountRequest(
                "Normalization Test Account",
                "MetaQuotes Demo",
                "MetaQuotes-Demo",
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

        MvcResult tokenResult = mockMvc.perform(post("/api/v1/mt5/connections/" + tradingAccountId + "/token")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andReturn();

        eaToken = objectMapper.readTree(tokenResult.getResponse().getContentAsString()).get("rawToken").asText();
    }

    @Test
    void testDealNormalizationAndJournalFlow() throws Exception {
        // 1. Ingest ENTRY_IN deal (Open Trade)
        DealDto openDeal = new DealDto();
        openDeal.setTicket(5001L);
        openDeal.setPositionId(901L);
        openDeal.setOrderTicket(801L);
        openDeal.setSymbol("EURUSD");
        openDeal.setDealType("DEAL_TYPE_BUY");
        openDeal.setEntryType("ENTRY_IN");
        openDeal.setVolume(new BigDecimal("1.00"));
        openDeal.setPrice(new BigDecimal("1.08000"));
        openDeal.setDealTime(Instant.parse("2026-10-12T08:00:00Z"));
        openDeal.setProfit(BigDecimal.ZERO);
        openDeal.setCommission(new BigDecimal("-3.50"));

        SyncBatchRequest openBatch = new SyncBatchRequest();
        openBatch.setBatchId(UUID.randomUUID().toString());
        openBatch.setDeals(List.of(openDeal));

        mockMvc.perform(post("/api/v1/mt5/sync/batch")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(openBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.insertedCount", is(1)));

        // 2. Verify Trade exists in OPEN status
        MvcResult tradesRes = mockMvc.perform(get("/api/v1/trades?accountId=" + tradingAccountId)
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].symbol", is("EURUSD")))
                .andExpect(jsonPath("$[0].direction", is("BUY")))
                .andExpect(jsonPath("$[0].tradeStatus", is("OPEN")))
                .andExpect(jsonPath("$[0].entryPrice", is(1.08)))
                .andExpect(jsonPath("$[0].totalVolume", is(1.0)))
                .andExpect(jsonPath("$[0].remainingVolume", is(1.0)))
                .andExpect(jsonPath("$[0].externalPositionId", is(901)))
                .andReturn();

        JsonNode tradesNode = objectMapper.readTree(tradesRes.getResponse().getContentAsString());
        long tradeId = tradesNode.get(0).get("id").asLong();

        // 3. Ingest ENTRY_OUT deal (Close Trade with Profit)
        DealDto closeDeal = new DealDto();
        closeDeal.setTicket(5002L);
        closeDeal.setPositionId(901L);
        closeDeal.setOrderTicket(802L);
        closeDeal.setSymbol("EURUSD");
        closeDeal.setDealType("DEAL_TYPE_SELL");
        closeDeal.setEntryType("ENTRY_OUT");
        closeDeal.setVolume(new BigDecimal("1.00"));
        closeDeal.setPrice(new BigDecimal("1.08500"));
        closeDeal.setDealTime(Instant.parse("2026-10-12T09:30:00Z"));
        closeDeal.setProfit(new BigDecimal("500.00"));
        closeDeal.setCommission(new BigDecimal("-3.50"));
        closeDeal.setSwap(new BigDecimal("-2.50"));

        SyncBatchRequest closeBatch = new SyncBatchRequest();
        closeBatch.setBatchId(UUID.randomUUID().toString());
        closeBatch.setDeals(List.of(closeDeal));

        mockMvc.perform(post("/api/v1/mt5/sync/batch")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.insertedCount", is(1)));

        // 4. Verify Trade updated to CLOSED status with correct Net PnL (500 - 3.50 - 3.50 - 2.50 = 490.50)
        mockMvc.perform(get("/api/v1/trades/" + tradeId)
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trade.tradeStatus", is("CLOSED")))
                .andExpect(jsonPath("$.trade.exitPrice", is(1.085)))
                .andExpect(jsonPath("$.trade.closedVolume", is(1.0)))
                .andExpect(jsonPath("$.trade.remainingVolume", is(0.0)))
                .andExpect(jsonPath("$.trade.grossPnl", is(500.0)))
                .andExpect(jsonPath("$.trade.commissionTotal", is(-7.0)))
                .andExpect(jsonPath("$.trade.swapTotal", is(-2.5)))
                .andExpect(jsonPath("$.trade.netPnl", is(490.5)))
                .andExpect(jsonPath("$.deals", hasSize(2))); // Associated MT5 deals!

        // 5. Update Journal Details
        UpdateJournalRequest journalReq = new UpdateJournalRequest();
        journalReq.setSetupName("Bull Flag Breakout");
        journalReq.setNotes("Clean retest of H1 resistance");
        journalReq.setEmotionBefore(EmotionBefore.CONFIDENT);
        journalReq.setEmotionAfter(EmotionAfter.SATISFIED);
        journalReq.setFollowedRules(true);
        journalReq.setMistakes("None");
        journalReq.setRating(5);
        journalReq.setRiskAmount(new BigDecimal("200.00"));

        mockMvc.perform(put("/api/v1/trades/" + tradeId + "/journal")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(journalReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupName", is("Bull Flag Breakout")))
                .andExpect(jsonPath("$.notes", is("Clean retest of H1 resistance")))
                .andExpect(jsonPath("$.emotionBefore", is("CONFIDENT")))
                .andExpect(jsonPath("$.emotionAfter", is("SATISFIED")))
                .andExpect(jsonPath("$.followedRules", is(true)))
                .andExpect(jsonPath("$.rating", is(5)))
                .andExpect(jsonPath("$.rMultiple", is(2.4525))); // 490.50 / 200.00 = 2.4525 R!

        // 6. Create Manual Trade
        CreateManualTradeRequest manualReq = new CreateManualTradeRequest();
        manualReq.setTradingAccountId(tradingAccountId);
        manualReq.setSymbol("GBPUSD");
        manualReq.setDirection(TradeDirection.SELL);
        manualReq.setTotalVolume(new BigDecimal("0.50"));
        manualReq.setEntryPrice(new BigDecimal("1.31200"));
        manualReq.setExitPrice(new BigDecimal("1.30800"));
        manualReq.setGrossPnl(new BigDecimal("200.00"));
        manualReq.setCommissionTotal(new BigDecimal("-3.00"));
        manualReq.setSetupName("Range Breakdown");
        manualReq.setNotes("Manual discretionary trade");

        mockMvc.perform(post("/api/v1/trades")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(manualReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.symbol", is("GBPUSD")))
                .andExpect(jsonPath("$.tradeSource", is("MANUAL")))
                .andExpect(jsonPath("$.tradeStatus", is("CLOSED")))
                .andExpect(jsonPath("$.netPnl", is(197.0)));

        // 7. Verify Listing with Symbol Filter
        mockMvc.perform(get("/api/v1/trades?accountId=" + tradingAccountId + "&symbol=GBPUSD")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].symbol", is("GBPUSD")));
    }
}
