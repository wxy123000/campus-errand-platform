package com.campus.campuserrand.dto;

import lombok.Data;

@Data
public class RunnerDeliveryRequest {
    private String pin;
    private String photoProofUrl;
    private String photoProofNote;
}
