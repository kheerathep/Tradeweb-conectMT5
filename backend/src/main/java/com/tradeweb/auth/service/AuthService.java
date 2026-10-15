package com.tradeweb.auth.service;

import com.tradeweb.account.entity.AccountStatus;
import com.tradeweb.account.entity.AccountType;
import com.tradeweb.account.entity.TradingAccount;
import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.auth.dto.AuthResponse;
import com.tradeweb.auth.dto.GoogleAuthRequest;
import com.tradeweb.auth.dto.LoginRequest;
import com.tradeweb.auth.dto.RegisterRequest;
import com.tradeweb.common.exception.DuplicateResourceException;
import com.tradeweb.common.exception.UnauthorizedException;
import com.tradeweb.common.util.SecurityUtils;
import com.tradeweb.user.dto.UserProfileDto;
import com.tradeweb.user.entity.User;
import com.tradeweb.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TradingAccountRepository tradingAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthService(
            UserRepository userRepository,
            TradingAccountRepository tradingAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifierService googleTokenVerifierService
    ) {
        this.userRepository = userRepository;
        this.tradingAccountRepository = tradingAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("This username is already taken");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = new User(
                request.getEmail(),
                request.getUsername(),
                passwordHash,
                request.getDisplayName() != null ? request.getDisplayName() : request.getUsername(),
                request.getTimezone() != null ? request.getTimezone() : "UTC"
        );
        User savedUser = userRepository.save(user);

        // Provision initial default trading account for the new user
        TradingAccount defaultAccount = new TradingAccount(
                savedUser.getId(),
                "Main Trading Account",
                null,
                null,
                AccountType.PERSONAL,
                "USD",
                BigDecimal.ZERO,
                AccountStatus.ACTIVE
        );
        tradingAccountRepository.save(defaultAccount);

        String token = jwtService.generateToken(savedUser);
        setAuthCookie(response, token);

        return new AuthResponse(
                UserProfileDto.fromEntity(savedUser),
                token,
                "Registration successful"
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmailOrUsername(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        String token = jwtService.generateToken(user);
        setAuthCookie(response, token);

        return new AuthResponse(
                UserProfileDto.fromEntity(user),
                token,
                "Login successful"
        );
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request, HttpServletResponse response) {
        GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verifyToken(request.getCredential());

        String email = googleUser.email();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String baseUsername = generateUsernameFromEmail(email, googleUser.name());
            String uniqueUsername = generateUniqueUsername(baseUsername);
            String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());

            String displayName = (googleUser.name() != null && !googleUser.name().isBlank())
                    ? googleUser.name()
                    : uniqueUsername;

            user = new User(
                    email,
                    uniqueUsername,
                    randomPassword,
                    displayName,
                    "UTC"
            );
            user = userRepository.save(user);

            // Provision initial default trading account for new Google user
            TradingAccount defaultAccount = new TradingAccount(
                    user.getId(),
                    "Main Trading Account",
                    null,
                    null,
                    AccountType.PERSONAL,
                    "USD",
                    BigDecimal.ZERO,
                    AccountStatus.ACTIVE
            );
            tradingAccountRepository.save(defaultAccount);
        }

        String token = jwtService.generateToken(user);
        setAuthCookie(response, token);

        return new AuthResponse(
                UserProfileDto.fromEntity(user),
                token,
                "Google login successful"
        );
    }

    private String generateUsernameFromEmail(String email, String name) {
        if (email != null && email.contains("@")) {
            String prefix = email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9_]", "_");
            if (!prefix.isBlank()) {
                return prefix.toLowerCase();
            }
        }
        if (name != null && !name.isBlank()) {
            String sanitized = name.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
            if (!sanitized.isBlank()) {
                return sanitized;
            }
        }
        return "user";
    }

    private String generateUniqueUsername(String baseUsername) {
        String candidate = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = baseUsername + "_" + counter++;
        }
        return candidate;
    }

    public void logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("access_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUser() {
        User currentUser = SecurityUtils.getCurrentUser();
        return UserProfileDto.fromEntity(currentUser);
    }

    private void setAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("access_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 24 hours
        response.addCookie(cookie);
    }
}
