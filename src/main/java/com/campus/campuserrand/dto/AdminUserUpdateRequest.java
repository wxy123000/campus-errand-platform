package com.campus.campuserrand.dto;

import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    private String username;
    private String phone;
    private String role;
    private Integer points;
    private Boolean verified;
}
