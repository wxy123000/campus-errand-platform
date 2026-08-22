package com.campus.campuserrand.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminBulkOrderActionRequest {
    private String action;
    private String reason;
    private List<String> orderNos;
}
