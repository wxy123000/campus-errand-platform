package com.campus.campuserrand.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateOrderRequest {
    private String orderType;
    private String pickupMethod;
    private String pickupLocation;
    private String pickupNotes;
    private String deliveryLocation;
    private String deliveryMethod;
    private String timeWindowType;
    private String preferredLatestTime;
    private BigDecimal optionalTip;
}
