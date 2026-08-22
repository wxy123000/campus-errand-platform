package com.campus.campuserrand.dto;

import com.campus.campuserrand.entity.ErrandOrder;
import lombok.Data;

@Data
public class OrderResponse {
    private String message;
    private ErrandOrder order;
}
