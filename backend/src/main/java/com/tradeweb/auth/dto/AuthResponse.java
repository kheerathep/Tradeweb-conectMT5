package com.tradeweb.auth.dto;

import com.tradeweb.user.dto.UserProfileDto;

public class AuthResponse {
    private UserProfileDto user;
    private String token;
    private String message;

    public AuthResponse() {}

    public AuthResponse(UserProfileDto user, String token, String message) {
        this.user = user;
        this.token = token;
        this.message = message;
    }

    public UserProfileDto getUser() {
        return user;
    }

    public void setUser(UserProfileDto user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
