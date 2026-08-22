package com.campus.campuserrand.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String password;
    private String phone;
    private String role;
    private String email;
    private Boolean verified;
    private String commonAddress;
    private String detailAddress;
    private Integer points;
    private Boolean starterPointsGranted;
    private LocalDateTime lastWeeklyClaimAt;
    private LocalDateTime weeklyCardExpiresAt;
    private String inviteCode;
    private Long referredByUserId;
    private String runnerApplicationStatus;
    private LocalDateTime runnerApplicationRequestedAt;
    private LocalDateTime runnerApplicationReviewedAt;
    private Boolean banned;
    private String banReason;
    private LocalDateTime bannedAt;
    private Integer cancellationCount;
    private Integer runnerGiveUpCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
