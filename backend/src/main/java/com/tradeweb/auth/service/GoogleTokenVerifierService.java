package com.tradeweb.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradeweb.common.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    @Value("${app.google.client-id:}")
    private String configuredClientId;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GoogleTokenVerifierService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public GoogleUserInfo verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new UnauthorizedException("Google credential token is missing");
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKENINFO_URL + idToken.trim()))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Google token verification failed with status: {}, body: {}", response.statusCode(), response.body());
                throw new UnauthorizedException("Invalid or expired Google authentication credential");
            }

            JsonNode root = objectMapper.readTree(response.body());

            String email = root.hasNonNull("email") ? root.get("email").asText() : null;
            boolean emailVerified = root.hasNonNull("email_verified") && 
                    ("true".equalsIgnoreCase(root.get("email_verified").asText()) || root.get("email_verified").asBoolean(false));
            String aud = root.hasNonNull("aud") ? root.get("aud").asText() : null;
            String name = root.hasNonNull("name") ? root.get("name").asText() : null;
            String picture = root.hasNonNull("picture") ? root.get("picture").asText() : null;
            String sub = root.hasNonNull("sub") ? root.get("sub").asText() : null;

            if (email == null || !emailVerified) {
                throw new UnauthorizedException("Google account email is not verified or accessible");
            }

            if (configuredClientId != null && !configuredClientId.isBlank()) {
                if (!configuredClientId.equals(aud)) {
                    log.error("Google token audience mismatch! Expected: {}, Received: {}", configuredClientId, aud);
                    throw new UnauthorizedException("Google Client ID mismatch");
                }
            }

            return new GoogleUserInfo(email, name, picture, sub, aud);

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error communicating with Google OAuth verification service", e);
            throw new UnauthorizedException("Failed to verify Google token: " + e.getMessage());
        }
    }

    public record GoogleUserInfo(
            String email,
            String name,
            String picture,
            String sub,
            String aud
    ) {}
}
