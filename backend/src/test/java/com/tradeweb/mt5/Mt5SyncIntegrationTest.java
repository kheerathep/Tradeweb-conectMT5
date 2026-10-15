package com.tradeweb.mt5;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.auth.dto.RegisterRequest;
import com.tradeweb.mt5.dto.AccountInfoDto;
import com.tradeweb.mt5.dto.DealDto;
import com.tradeweb.mt5.dto.HeartbeatRequest;
import com.tradeweb.mt5.dto.SyncBatchRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Mt5SyncIntegrationTest {

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
                "mt5user_" + uniqueSuffix + "@example.com",
                "mt5user_" + uniqueSuffix,
                "StrongPassword123!",
                "MT5 User " + uniqueSuffix,
                "UTC"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        userJwt = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("token").asText();

        // Create a trading account
        CreateAccountRequest accountReq = new CreateAccountRequest(
                "MT5 Test Account",
                "MetaQuotes Software Corp.",
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
    }

    @Test
    void testEaTokenGenerationAndSyncFlow() throws Exception {
        // 1. Generate MT5 EA token
        MvcResult tokenResult = mockMvc.perform(post("/api/v1/mt5/connections/" + tradingAccountId + "/token")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rawToken", startsWith("tj_")))
                .andExpect(jsonPath("$.connectionStatus", is("PENDING")))
                .andReturn();

        JsonNode tokenNode = objectMapper.readTree(tokenResult.getResponse().getContentAsString());
        String eaToken = tokenNode.get("rawToken").asText();

        // 2. Query sync status with EA token
        mockMvc.perform(get("/api/v1/mt5/sync/status")
                        .header("Authorization", "Bearer " + eaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.totalDealsImported", is(0)));

        // 3. Reject invalid EA token
        mockMvc.perform(get("/api/v1/mt5/sync/status")
                        .header("Authorization", "Bearer tj_invalidtoken1234567890"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode", is("INVALID_EA_TOKEN")));

        // 4. Send Batch with 2 Deals
        DealDto deal1 = new DealDto();
        deal1.setTicket(2001L);
        deal1.setPositionId(101L);
        deal1.setOrderTicket(301L);
        deal1.setSymbol("EURUSD");
        deal1.setDealType("DEAL_TYPE_BUY");
        deal1.setEntryType("ENTRY_IN");
        deal1.setVolume(new BigDecimal("0.50"));
        deal1.setPrice(new BigDecimal("1.08500"));
        deal1.setDealTime(Instant.parse("2026-10-10T10:00:00Z"));
        deal1.setProfit(new BigDecimal("0.00"));

        DealDto deal2 = new DealDto();
        deal2.setTicket(2002L);
        deal2.setPositionId(101L);
        deal2.setOrderTicket(302L);
        deal2.setSymbol("EURUSD");
        deal2.setDealType("DEAL_TYPE_SELL");
        deal2.setEntryType("ENTRY_OUT");
        deal2.setVolume(new BigDecimal("0.50"));
        deal2.setPrice(new BigDecimal("1.08750"));
        deal2.setDealTime(Instant.parse("2026-10-10T10:30:00Z"));
        deal2.setProfit(new BigDecimal("125.00"));

        AccountInfoDto accountInfo = new AccountInfoDto();
        accountInfo.setLogin(888888L);
        accountInfo.setBalance(new BigDecimal("10125.00"));
        accountInfo.setEquity(new BigDecimal("10125.00"));
        accountInfo.setCurrency("USD");
        accountInfo.setAccountName("Demo Trader");
        accountInfo.setCompany("MetaQuotes");

        SyncBatchRequest batchReq = new SyncBatchRequest();
        batchReq.setBatchId(UUID.randomUUID().toString());
        batchReq.setDeals(List.of(deal1, deal2));
        batchReq.setAccountInfo(accountInfo);
        batchReq.setCheckpoint(Instant.parse("2026-10-10T10:30:00Z"));

        mockMvc.perform(post("/api/v1/mt5/sync/batch")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.totalReceived", is(2)))
                .andExpect(jsonPath("$.insertedCount", is(2)))
                .andExpect(jsonPath("$.duplicateCount", is(0)))
                .andExpect(jsonPath("$.rejectedCount", is(0)));

        // 5. Deduplication check: Resend same batch -> insertedCount = 0, duplicateCount = 2
        mockMvc.perform(post("/api/v1/mt5/sync/batch")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.totalReceived", is(2)))
                .andExpect(jsonPath("$.insertedCount", is(0)))
                .andExpect(jsonPath("$.duplicateCount", is(2)))
                .andExpect(jsonPath("$.rejectedCount", is(0)));

        // 6. Partial rejection test: Send 1 valid deal and 1 invalid deal
        DealDto validDeal = new DealDto();
        validDeal.setTicket(2003L);
        validDeal.setSymbol("XAUUSD");
        validDeal.setDealType("DEAL_TYPE_BUY");
        validDeal.setVolume(new BigDecimal("0.10"));
        validDeal.setPrice(new BigDecimal("2650.00"));
        validDeal.setDealTime(Instant.parse("2026-10-11T09:00:00Z"));

        DealDto invalidDeal = new DealDto();
        invalidDeal.setTicket(null); // Missing required ticket!
        invalidDeal.setSymbol("XAUUSD");
        invalidDeal.setDealType("DEAL_TYPE_BUY");
        invalidDeal.setVolume(new BigDecimal("0.10"));
        invalidDeal.setPrice(new BigDecimal("2650.00"));
        invalidDeal.setDealTime(Instant.parse("2026-10-11T09:00:00Z"));

        SyncBatchRequest partialReq = new SyncBatchRequest();
        partialReq.setBatchId(UUID.randomUUID().toString());
        partialReq.setDeals(List.of(validDeal, invalidDeal));

        mockMvc.perform(post("/api/v1/mt5/sync/batch")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(partialReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PARTIAL")))
                .andExpect(jsonPath("$.totalReceived", is(2)))
                .andExpect(jsonPath("$.insertedCount", is(1)))
                .andExpect(jsonPath("$.rejectedCount", is(1)))
                .andExpect(jsonPath("$.rejectionReasons", hasSize(1)));

        // 7. Verify Deals & Batches via User API
        mockMvc.perform(get("/api/v1/mt5/connections/" + tradingAccountId + "/deals")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3))); // 2 from first batch, 1 from second batch

        mockMvc.perform(get("/api/v1/mt5/connections/" + tradingAccountId + "/batches")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3))); // 3 batches processed

        // 8. Heartbeat test
        HeartbeatRequest hb = new HeartbeatRequest();
        hb.setAccountLogin(888888L);
        hb.setBalance(new BigDecimal("10500.00"));
        hb.setEquity(new BigDecimal("10550.00"));
        hb.setCurrency("USD");
        hb.setServer("MetaQuotes-Demo");

        mockMvc.perform(post("/api/v1/mt5/sync/heartbeat")
                        .header("Authorization", "Bearer " + eaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hb)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("OK")));

        // 9. Token rotation & revocation
        MvcResult rotateResult = mockMvc.perform(post("/api/v1/mt5/connections/" + tradingAccountId + "/token")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rawToken", startsWith("tj_")))
                .andReturn();

        String newEaToken = objectMapper.readTree(rotateResult.getResponse().getContentAsString()).get("rawToken").asText();

        // Old token must fail
        mockMvc.perform(get("/api/v1/mt5/sync/status")
                        .header("Authorization", "Bearer " + eaToken))
                .andExpect(status().isUnauthorized());

        // New token must succeed
        mockMvc.perform(get("/api/v1/mt5/sync/status")
                        .header("Authorization", "Bearer " + newEaToken))
                .andExpect(status().isOk());

        // Disconnect
        mockMvc.perform(post("/api/v1/mt5/connections/" + tradingAccountId + "/disconnect")
                        .header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectionStatus", is("DISCONNECTED")));

        // New token is now revoked
        mockMvc.perform(get("/api/v1/mt5/sync/status")
                        .header("Authorization", "Bearer " + newEaToken))
                .andExpect(status().isUnauthorized());
    }
}
