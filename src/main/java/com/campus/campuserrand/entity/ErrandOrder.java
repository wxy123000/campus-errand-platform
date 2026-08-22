package com.campus.campuserrand.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ErrandOrder {
    private Long id;
    private Long userId;
    private Long runnerId;
    private String customerUsername;
    private String customerPhone;
    private String runnerUsername;
    private String runnerPhone;
    private String orderNo;
    private String orderType;
    private String orderTypeLabel;
    private String pickupMethod;
    private String pickupLocation;
    private String pickupNotes;
    private String deliveryLocation;
    private String deliveryMethod;
    private String deliveryPin;
    private String deliveryProofStatus;
    private String photoProofUrl;
    private String photoProofNote;
    private String timeWindowType;
    private String timeWindowLabel;
    private LocalDateTime preferredLatestTime;
    private BigDecimal baseFee;
    private BigDecimal distanceFee;
    private BigDecimal urgencyFee;
    private BigDecimal complexityFee;
    private BigDecimal tipFee;
    private BigDecimal weeklyCardDiscountFee;
    private BigDecimal totalFee;
    private Integer pointsCost;
    private String status;
    private String statusLabel;
    private String cancelReason;
    private LocalDateTime cancelledAt;
    private LocalDateTime customerConfirmedAt;
    private LocalDateTime pointsTransferredAt;
    private Integer runnerReviewScore;
    private String reviewComment;
    private LocalDateTime reviewedAt;
    private String appealStatus;
    private String appealReason;
    private String appealResolution;
    private LocalDateTime appealCreatedAt;
    private LocalDateTime appealResolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
