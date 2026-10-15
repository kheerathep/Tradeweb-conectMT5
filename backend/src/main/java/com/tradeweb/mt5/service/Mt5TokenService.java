package com.tradeweb.mt5.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
public class Mt5TokenService {

    private static final String TOKEN_PREFIX = "tj_";
    private static final int RANDOM_BYTES_COUNT = 24; // 48 hex chars
    private final SecureRandom secureRandom = new SecureRandom();

    public static class GeneratedToken {
        private final String rawToken;
        private final String tokenHash;
        private final String tokenPrefix;

        public GeneratedToken(String rawToken, String tokenHash, String tokenPrefix) {
            this.rawToken = rawToken;
            this.tokenHash = tokenHash;
            this.tokenPrefix = tokenPrefix;
        }

        public String getRawToken() {
            return rawToken;
        }

        public String getTokenHash() {
            return tokenHash;
        }

        public String getTokenPrefix() {
            return tokenPrefix;
        }
    }

    public GeneratedToken generateNewToken() {
        byte[] randomBytes = new byte[RANDOM_BYTES_COUNT];
        secureRandom.nextBytes(randomBytes);
        String hexRandom = HexFormat.of().formatHex(randomBytes);
        String rawToken = TOKEN_PREFIX + hexRandom;

        String tokenHash = hashToken(rawToken);
        String prefix = rawToken.substring(0, 8); // e.g. "tj_8f92a"

        return new GeneratedToken(rawToken, tokenHash, prefix);
    }

    public String generateToken() {
        return generateNewToken().getRawToken();
    }

    public String extractPrefix(String rawToken) {
        if (rawToken != null && rawToken.length() >= 8) {
            return rawToken.substring(0, 8);
        }
        return TOKEN_PREFIX;
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
