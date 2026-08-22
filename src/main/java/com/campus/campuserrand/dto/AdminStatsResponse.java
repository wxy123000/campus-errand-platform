package com.campus.campuserrand.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdminStatsResponse {
    private int totalUsers;
    private int runnerUsers;
    private int adminUsers;
    private int totalOrders;
    private int activeOrders;
    private int completedOrders;
    private int cancelledOrders;
    private int bannedUsers;
    private int openAppeals;
    private BigDecimal totalPointsSpent;
}
