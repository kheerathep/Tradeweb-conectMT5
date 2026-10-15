package com.tradeweb.auth.controller;

import com.tradeweb.auth.dto.AuthResponse;
import com.tradeweb.auth.dto.GoogleAuthRequest;
import com.tradeweb.auth.dto.LoginRequest;
import com.tradeweb.auth.dto.RegisterRequest;
import com.tradeweb.auth.service.AuthService;
import com.tradeweb.user.dto.UserProfileDto;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.register(request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.loginWithGoogle(request, response);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUser() {
        UserProfileDto profile = authService.getCurrentUser();
        return ResponseEntity.ok(profile);
    }
}
