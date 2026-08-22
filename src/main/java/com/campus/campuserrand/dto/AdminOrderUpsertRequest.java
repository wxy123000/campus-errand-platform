package com.campus.campuserrand.dto;

import lombok.Data;

@Data
public class AdminOrderUpsertRequest {
    private Long userId;
    private Long runnerId;
    private String orderType;
    private String orderTypeLabel;
    private String pickupLocation;
    private String pickupNotes;
    private String deliveryLocation;
    private String deliveryMethod;
    private String timeWindowLabel;
    private Integer pointsCost;
    private String status;
}
