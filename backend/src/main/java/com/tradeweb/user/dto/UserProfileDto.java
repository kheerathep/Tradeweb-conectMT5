package com.tradeweb.user.dto;

import com.tradeweb.user.entity.User;
import java.time.Instant;

public class UserProfileDto {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String timezone;
    private Instant createdAt;

    public UserProfileDto() {}

    public UserProfileDto(Long id, String email, String username, String displayName, String timezone, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.displayName = displayName;
        this.timezone = timezone;
        this.createdAt = createdAt;
    }

    public static UserProfileDto fromEntity(User user) {
        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getTimezone(),
                user.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
