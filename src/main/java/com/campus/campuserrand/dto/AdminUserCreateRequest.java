package com.campus.campuserrand.dto;

import lombok.Data;

@Data
public class AdminUserCreateRequest {
    private String username;
    private String email;
    private String phone;
    private String password;
    private String role;
    private Integer points;
}
