package com.campus.campuserrand.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminBulkUserActionRequest {
    private String action;
    private String reason;
    private List<Long> userIds;
}
