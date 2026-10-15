package com.tradeweb.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradeweb.account.dto.CreateAccountRequest;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.auth.dto.LoginRequest;
import com.tradeweb.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthAndAccountIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegisterAndLoginFlow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "trader_alpha@example.com",
                "trader_alpha",
                "StrongPassword123!",
                "Trader Alpha",
                "Asia/Bangkok"
        );

        // 1. Register new user
        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.user.email", is("trader_alpha@example.com")))
                .andExpect(jsonPath("$.user.username", is("trader_alpha")))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();

        String token = objectMapper.readTree(registerResult.getResponse().getContentAsString()).get("token").asText();

        // 2. Fetch current user via Bearer token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("trader_alpha")))
                .andExpect(jsonPath("$.timezone", is("Asia/Bangkok")));

        // 3. Login with correct credentials
        LoginRequest loginReq = new LoginRequest("trader_alpha", "StrongPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("access_token"))
                .andExpect(jsonPath("$.user.username", is("trader_alpha")));

        // 4. Default account was created automatically
        mockMvc.perform(get("/api/v1/accounts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].accountName", is("Main Trading Account")));
    }

    @Test
    void testDuplicateRegistration() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "dup_user@example.com",
                "dup_user",
                "Password123!",
                "Dup User",
                "UTC"
        );

        // First registration succeeds
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Second registration with same email fails with 409 Conflict
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("CONFLICT")));
    }

    @Test
    void testInvalidCredentials() throws Exception {
        LoginRequest loginReq = new LoginRequest("non_existent_user", "WrongPassword");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode", is("UNAUTHORIZED")));
    }

    @Test
    void testUnauthenticatedAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testUserIsolationAndAccountCrud() throws Exception {
        // Register User A
        RegisterRequest userAReq = new RegisterRequest("usera@example.com", "usera", "Pass123456", "User A", "UTC");
        MvcResult resA = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userAReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String tokenA = objectMapper.readTree(resA.getResponse().getContentAsString()).get("token").asText();

        // Register User B
        RegisterRequest userBReq = new RegisterRequest("userb@example.com", "userb", "Pass123456", "User B", "UTC");
        MvcResult resB = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userBReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String tokenB = objectMapper.readTree(resB.getResponse().getContentAsString()).get("token").asText();

        // User A creates a Prop account
        CreateAccountRequest createReq = new CreateAccountRequest(
                "FTMO 100k",
                "FTMO",
                "FTMO-Server-Demo",
                AccountType.PROP,
                "USD",
                new BigDecimal("100000.00")
        );
        MvcResult createRes = mockMvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountName", is("FTMO 100k")))
                .andReturn();

        long accountIdA = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // User B attempts to access User A's account -> Must be rejected (404/Forbidden)
        mockMvc.perform(get("/api/v1/accounts/" + accountIdA)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // User B listing accounts should not see User A's "FTMO 100k"
        mockMvc.perform(get("/api/v1/accounts")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].accountName", not(hasItem("FTMO 100k"))));
    }
}
