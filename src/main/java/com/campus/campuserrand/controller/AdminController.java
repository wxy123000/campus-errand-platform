package com.campus.campuserrand.controller;

import com.campus.campuserrand.dto.AdminOrderActionRequest;
import com.campus.campuserrand.dto.AdminOrderUpsertRequest;
import com.campus.campuserrand.dto.AdminStatsResponse;
import com.campus.campuserrand.dto.AdminAppealResolveRequest;
import com.campus.campuserrand.dto.AdminBulkOrderActionRequest;
import com.campus.campuserrand.dto.AdminBulkUserActionRequest;
import com.campus.campuserrand.dto.AdminUserCreateRequest;
import com.campus.campuserrand.dto.AdminUserUpdateRequest;
import com.campus.campuserrand.entity.ErrandOrder;
import com.campus.campuserrand.entity.User;
import com.campus.campuserrand.service.AdminService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats(@RequestHeader("Authorization") String authorizationHeader) {
        return adminService.getStats(authorizationHeader);
    }

    @GetMapping("/users")
    public List<User> users(@RequestHeader("Authorization") String authorizationHeader) {
        return adminService.listUsers(authorizationHeader);
    }

    @PostMapping("/users")
    public User createUser(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody AdminUserCreateRequest request
    ) {
        return adminService.createUser(authorizationHeader, request);
    }

    @PostMapping("/users/{userId}")
    public User updateUser(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("userId") Long userId,
            @RequestBody AdminUserUpdateRequest request
    ) {
        return adminService.updateUser(authorizationHeader, userId, request);
    }

    @DeleteMapping("/users/{userId}")
    public Map<String, Object> deleteUser(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("userId") Long userId
    ) {
        adminService.deleteUser(authorizationHeader, userId);
        return Map.of("message", "User deleted.");
    }

    @PostMapping("/users/bulk")
    public Map<String, Object> bulkUserAction(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody AdminBulkUserActionRequest request
    ) {
        adminService.bulkUserAction(authorizationHeader, request);
        return Map.of("message", "Bulk user action completed.");
    }

    @PostMapping("/users/{userId}/runner-application/approve")
    public User approveRunnerApplication(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("userId") Long userId
    ) {
        return adminService.approveRunnerApplication(authorizationHeader, userId);
    }

    @PostMapping("/users/{userId}/runner-application/reject")
    public User rejectRunnerApplication(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("userId") Long userId
    ) {
        return adminService.rejectRunnerApplication(authorizationHeader, userId);
    }

    @GetMapping("/orders")
    public List<ErrandOrder> orders(@RequestHeader("Authorization") String authorizationHeader) {
        return adminService.listOrders(authorizationHeader);
    }

    @PostMapping("/orders")
    public ErrandOrder createOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody AdminOrderUpsertRequest request
    ) {
        return adminService.createOrder(authorizationHeader, request);
    }

    @PostMapping("/orders/{orderNo}")
    public ErrandOrder updateOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody AdminOrderUpsertRequest request
    ) {
        return adminService.updateOrder(authorizationHeader, orderNo, request);
    }

    @DeleteMapping("/orders/{orderNo}")
    public Map<String, Object> deleteOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo
    ) {
        adminService.deleteOrder(authorizationHeader, orderNo);
        return Map.of("message", "Order deleted.");
    }

    @PostMapping("/orders/bulk")
    public Map<String, Object> bulkOrderAction(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody AdminBulkOrderActionRequest request
    ) {
        adminService.bulkOrderAction(authorizationHeader, request);
        return Map.of("message", "Bulk order action completed.");
    }

    @PostMapping("/orders/{orderNo}/cancel")
    public Map<String, Object> cancelOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody(required = false) AdminOrderActionRequest request
    ) {
        adminService.cancelOrder(authorizationHeader, orderNo, request == null ? null : request.getReason());
        return Map.of("message", "Order cancelled by admin.");
    }

    @PostMapping("/orders/{orderNo}/appeal/resolve")
    public Map<String, Object> resolveAppeal(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody AdminAppealResolveRequest request
    ) {
        adminService.resolveAppeal(authorizationHeader, orderNo, request == null ? null : request.getResolution());
        return Map.of("message", "Appeal resolved.");
    }

    @GetMapping("/reviews")
    public List<ErrandOrder> reviews(@RequestHeader("Authorization") String authorizationHeader) {
        return adminService.listReviews(authorizationHeader);
    }

}
