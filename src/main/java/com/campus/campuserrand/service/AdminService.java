package com.campus.campuserrand.service;

import com.campus.campuserrand.dto.AdminOrderUpsertRequest;
import com.campus.campuserrand.dto.AdminStatsResponse;
import com.campus.campuserrand.dto.AdminBulkOrderActionRequest;
import com.campus.campuserrand.dto.AdminBulkUserActionRequest;
import com.campus.campuserrand.dto.AdminUserCreateRequest;
import com.campus.campuserrand.dto.AdminUserUpdateRequest;
import com.campus.campuserrand.entity.ErrandOrder;
import com.campus.campuserrand.entity.User;
import com.campus.campuserrand.entity.UserSession;
import com.campus.campuserrand.exception.BusinessException;
import com.campus.campuserrand.mapper.AdminMapper;
import com.campus.campuserrand.mapper.AuthMapper;
import com.campus.campuserrand.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AdminService {

    private final AdminMapper adminMapper;
    private final AuthMapper authMapper;
    private final OrderMapper orderMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminService(AdminMapper adminMapper, AuthMapper authMapper, OrderMapper orderMapper) {
        this.adminMapper = adminMapper;
        this.authMapper = authMapper;
        this.orderMapper = orderMapper;
    }

    public AdminStatsResponse getStats(String authorizationHeader) {
        ensureAdmin(authorizationHeader);
        return adminMapper.loadStats();
    }

    public List<User> listUsers(String authorizationHeader) {
        ensureAdmin(authorizationHeader);
        return adminMapper.findAllUsers();
    }

    public List<ErrandOrder> listOrders(String authorizationHeader) {
        ensureAdmin(authorizationHeader);
        return adminMapper.findAllOrders();
    }

    public List<ErrandOrder> listReviews(String authorizationHeader) {
        ensureAdmin(authorizationHeader);
        return adminMapper.findReviewOrders();
    }

    @Transactional
    public User createUser(String authorizationHeader, AdminUserCreateRequest request) {
        ensureAdmin(authorizationHeader);
        validateUserCreateRequest(request);
        if (authMapper.findUserByEmail(normalizeEmail(request.getEmail())) != null) {
            throw new BusinessException("This email already exists.");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(normalizeEmail(request.getEmail()));
        user.setPhone(request.getPhone().trim());
        user.setPassword(request.getPassword());
        user.setRole(normalizeRole(request.getRole()));
        user.setVerified(true);
        user.setPoints(request.getPoints() == null ? 0 : request.getPoints());
        user.setInviteCode(generateInviteCode(user.getUsername()));
        user.setBanned(false);
        user.setCancellationCount(0);
        user.setRunnerGiveUpCount(0);
        applyRunnerApplicationStateForRole(user, user.getRole());
        adminMapper.insertAdminUser(user);
        User saved = authMapper.findUserById(user.getId());
        recordPointChange(saved, saved.getPoints() == null ? 0 : saved.getPoints(), "ADMIN_INITIAL_POINTS", "Initial points set by administrator.", null);
        saved.setPassword(null);
        return saved;
    }

    @Transactional
    public User updateUser(String authorizationHeader, Long userId, AdminUserUpdateRequest request) {
        User admin = ensureAdmin(authorizationHeader);
        if (userId == null) {
            throw new BusinessException("User id is required.");
        }
        User target = authMapper.findUserById(userId);
        if (target == null) {
            throw new BusinessException("User not found.");
        }
        String role = normalizeRole(request == null ? null : request.getRole());
        Integer points = request == null ? null : request.getPoints();
        if (points == null || points < 0) {
            throw new BusinessException("Points must be zero or greater.");
        }
        if (admin.getId().equals(userId) && !"ADMIN".equals(role)) {
            throw new BusinessException("You cannot remove your own admin access.");
        }

        String previousRole = target.getRole();
        int previousPoints = target.getPoints() == null ? 0 : target.getPoints();
        target.setRole(role);
        target.setPoints(points);
        applyRunnerApplicationStateForRole(target, previousRole, role);
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            target.setUsername(request.getUsername().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            target.setPhone(request.getPhone().trim());
        }
        target.setVerified(request.getVerified() == null ? target.getVerified() : request.getVerified());
        adminMapper.updateAdminUser(target);
        User refreshed = authMapper.findUserById(userId);
        int pointDelta = (refreshed.getPoints() == null ? 0 : refreshed.getPoints()) - previousPoints;
        recordPointChange(refreshed, pointDelta, "ADMIN_ADJUSTMENT", "Points adjusted by administrator.", null);
        refreshed.setPassword(null);
        return refreshed;
    }

    @Transactional
    public User approveRunnerApplication(String authorizationHeader, Long userId) {
        ensureAdmin(authorizationHeader);
        User target = findRunnerApplicationTarget(userId);
        if ("RUNNER".equalsIgnoreCase(target.getRole())) {
            throw new BusinessException("This user is already a runner.");
        }
        int updated = adminMapper.approveRunnerApplication(userId);
        if (updated == 0) {
            throw new BusinessException("Only pending runner applications can be approved.");
        }
        User refreshed = authMapper.findUserById(userId);
        refreshed.setPassword(null);
        return refreshed;
    }

    @Transactional
    public User rejectRunnerApplication(String authorizationHeader, Long userId) {
        ensureAdmin(authorizationHeader);
        findRunnerApplicationTarget(userId);
        int updated = adminMapper.rejectRunnerApplication(userId);
        if (updated == 0) {
            throw new BusinessException("Only pending runner applications can be rejected.");
        }
        User refreshed = authMapper.findUserById(userId);
        refreshed.setPassword(null);
        return refreshed;
    }

    @Transactional
    public void deleteUser(String authorizationHeader, Long userId) {
        User admin = ensureAdmin(authorizationHeader);
        if (userId == null) {
            throw new BusinessException("User id is required.");
        }
        if (admin.getId().equals(userId)) {
            throw new BusinessException("You cannot delete your own admin account.");
        }
        int deleted = adminMapper.deleteUser(userId);
        if (deleted == 0) {
            throw new BusinessException("User not found.");
        }
    }

    @Transactional
    public ErrandOrder createOrder(String authorizationHeader, AdminOrderUpsertRequest request) {
        ensureAdmin(authorizationHeader);
        ErrandOrder order = buildAdminOrder(new ErrandOrder(), request);
        order.setOrderNo("ADM" + System.currentTimeMillis());
        adminMapper.insertAdminOrder(order);
        return orderMapper.findOrderByOrderNo(order.getOrderNo());
    }

    @Transactional
    public ErrandOrder updateOrder(String authorizationHeader, String orderNo, AdminOrderUpsertRequest request) {
        ensureAdmin(authorizationHeader);
        ErrandOrder existing = orderMapper.findOrderByOrderNo(orderNo);
        if (existing == null) {
            throw new BusinessException("Order not found.");
        }
        ErrandOrder order = buildAdminOrder(existing, request);
        order.setOrderNo(existing.getOrderNo());
        int updated = adminMapper.updateAdminOrder(order);
        if (updated == 0) {
            throw new BusinessException("Order not found.");
        }
        return orderMapper.findOrderByOrderNo(existing.getOrderNo());
    }

    @Transactional
    public void deleteOrder(String authorizationHeader, String orderNo) {
        ensureAdmin(authorizationHeader);
        int deleted = adminMapper.deleteOrder(orderNo);
        if (deleted == 0) {
            throw new BusinessException("Order not found.");
        }
    }

    @Transactional
    public void cancelOrder(String authorizationHeader, String orderNo, String reason) {
        ensureAdmin(authorizationHeader);
        if (orderNo == null || orderNo.trim().isEmpty()) {
            throw new BusinessException("Order number is required.");
        }
        ErrandOrder order = orderMapper.findOrderByOrderNo(orderNo.trim());
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        int updated = adminMapper.cancelOrderByAdmin(order.getOrderNo(), trimToDefault(reason, "Cancelled by administrator."));
        if (updated == 0) {
            throw new BusinessException("This order cannot be cancelled from the admin console.");
        }
        if (order.getPointsTransferredAt() == null && order.getPointsCost() != null && order.getPointsCost() > 0) {
            authMapper.addPoints(order.getUserId(), order.getPointsCost());
            User customer = authMapper.findUserById(order.getUserId());
            recordPointChange(customer, order.getPointsCost(), "ADMIN_ORDER_REFUND", "Admin refund for cancelled order " + order.getOrderNo() + ".", order.getOrderNo());
        }
    }

    @Transactional
    public void resolveAppeal(String authorizationHeader, String orderNo, String resolution) {
        ensureAdmin(authorizationHeader);
        if (orderNo == null || orderNo.trim().isEmpty()) {
            throw new BusinessException("Order number is required.");
        }
        if (resolution == null || resolution.trim().isEmpty()) {
            throw new BusinessException("Resolution is required.");
        }
        int updated = adminMapper.resolveAppeal(orderNo.trim(), resolution.trim());
        if (updated == 0) {
            throw new BusinessException("No open appeal found for this order.");
        }
    }

    @Transactional
    public void bulkUserAction(String authorizationHeader, AdminBulkUserActionRequest request) {
        User admin = ensureAdmin(authorizationHeader);
        if (request == null || request.getUserIds() == null || request.getUserIds().isEmpty()) {
            throw new BusinessException("Please choose at least one user.");
        }
        String action = normalizeAction(request.getAction());
        for (Long userId : request.getUserIds()) {
            if (userId == null) {
                continue;
            }
            if (admin.getId().equals(userId) && ("DELETE".equals(action) || "BAN".equals(action))) {
                throw new BusinessException("You cannot delete or ban your own admin account.");
            }
            switch (action) {
                case "BAN" -> authMapper.banUser(userId, trimToDefault(request.getReason(), "Banned by administrator."));
                case "UNBAN" -> authMapper.unbanUser(userId);
                case "DELETE" -> adminMapper.deleteUser(userId);
                default -> throw new BusinessException("Unsupported user bulk action.");
            }
        }
    }

    @Transactional
    public void bulkOrderAction(String authorizationHeader, AdminBulkOrderActionRequest request) {
        ensureAdmin(authorizationHeader);
        if (request == null || request.getOrderNos() == null || request.getOrderNos().isEmpty()) {
            throw new BusinessException("Please choose at least one order.");
        }
        String action = normalizeAction(request.getAction());
        for (String orderNo : request.getOrderNos()) {
            if (orderNo == null || orderNo.trim().isEmpty()) {
                continue;
            }
            switch (action) {
                case "CANCEL" -> cancelOrder(authorizationHeader, orderNo.trim(), request.getReason());
                case "DELETE" -> adminMapper.deleteOrder(orderNo.trim());
                default -> throw new BusinessException("Unsupported order bulk action.");
            }
        }
    }

    private User ensureAdmin(String authorizationHeader) {
        UserSession session = findActiveSession(authorizationHeader);
        User user = authMapper.findUserById(session.getUserId());
        if (user == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Admin access is required.");
        }
        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new BusinessException("This admin account has been banned.");
        }
        return user;
    }

    private String normalizeAction(String action) {
        if (action == null || action.trim().isEmpty()) {
            throw new BusinessException("Action is required.");
        }
        return action.trim().toUpperCase(Locale.ROOT);
    }

    private UserSession findActiveSession(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        UserSession session = authMapper.findSessionByToken(token);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Login has expired. Please sign in again.");
        }
        return session;
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new BusinessException("A valid login token is required.");
        }
        return authorizationHeader.substring(7).trim();
    }

    private String normalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new BusinessException("Role is required.");
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!"USER".equals(normalized) && !"RUNNER".equals(normalized) && !"ADMIN".equals(normalized)) {
            throw new BusinessException("Unsupported role.");
        }
        return "USER".equals(normalized) ? "user" : normalized;
    }

    private String trimToDefault(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private void recordPointChange(User user, int changeAmount, String transactionType, String description, String orderNo) {
        if (user == null || changeAmount == 0) {
            return;
        }
        authMapper.insertPointTransaction(
                user.getId(),
                changeAmount,
                user.getPoints() == null ? 0 : user.getPoints(),
                transactionType,
                description,
                orderNo
        );
    }

    private User findRunnerApplicationTarget(Long userId) {
        if (userId == null) {
            throw new BusinessException("User id is required.");
        }
        User target = authMapper.findUserById(userId);
        if (target == null) {
            throw new BusinessException("User not found.");
        }
        if ("ADMIN".equalsIgnoreCase(target.getRole())) {
            throw new BusinessException("Admin accounts cannot be reviewed as runner applications.");
        }
        return target;
    }

    private void applyRunnerApplicationStateForRole(User user, String role) {
        applyRunnerApplicationStateForRole(user, user.getRole(), role);
    }

    private void applyRunnerApplicationStateForRole(User user, String previousRole, String role) {
        if ("RUNNER".equalsIgnoreCase(role)) {
            user.setRunnerApplicationStatus("APPROVED");
            user.setRunnerApplicationReviewedAt(LocalDateTime.now());
        } else if ("ADMIN".equalsIgnoreCase(role)) {
            user.setRunnerApplicationStatus("NONE");
            user.setRunnerApplicationReviewedAt(null);
        } else if ("RUNNER".equalsIgnoreCase(previousRole)) {
            user.setRunnerApplicationStatus("NONE");
            user.setRunnerApplicationReviewedAt(LocalDateTime.now());
        } else if (user.getRunnerApplicationStatus() == null || user.getRunnerApplicationStatus().isBlank()) {
            user.setRunnerApplicationStatus("NONE");
        }
    }

    private void validateUserCreateRequest(AdminUserCreateRequest request) {
        if (request == null) {
            throw new BusinessException("User data is required.");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BusinessException("Username is required.");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BusinessException("Email is required.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new BusinessException("Phone is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BusinessException("Password must be at least 6 characters.");
        }
        if (request.getPoints() != null && request.getPoints() < 0) {
            throw new BusinessException("Points must be zero or greater.");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateInviteCode(String displayName) {
        String prefix = displayName == null ? "ADMIN" : displayName.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
        if (prefix.length() < 4) {
            prefix = (prefix + "USER").substring(0, 4);
        }
        if (prefix.length() > 5) {
            prefix = prefix.substring(0, 5);
        }
        return prefix + String.format("%04d", secureRandom.nextInt(10_000));
    }

    private ErrandOrder buildAdminOrder(ErrandOrder order, AdminOrderUpsertRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new BusinessException("Customer is required.");
        }
        if (authMapper.findUserById(request.getUserId()) == null) {
            throw new BusinessException("Customer not found.");
        }
        if (request.getRunnerId() != null && authMapper.findUserById(request.getRunnerId()) == null) {
            throw new BusinessException("Runner not found.");
        }
        int points = request.getPointsCost() == null ? 0 : request.getPointsCost();
        if (points < 0) {
            throw new BusinessException("Points must be zero or greater.");
        }
        String status = normalizeStatus(request.getStatus());

        order.setUserId(request.getUserId());
        order.setRunnerId(request.getRunnerId());
        order.setOrderType(trimToDefault(request.getOrderType(), "COLLECTION_TASK"));
        order.setOrderTypeLabel(trimToDefault(request.getOrderTypeLabel(), "Parcel Collect"));
        order.setPickupLocation(trimToDefault(request.getPickupLocation(), "Admin entered pickup"));
        order.setPickupNotes(trimToDefault(request.getPickupNotes(), "Created from admin console."));
        order.setDeliveryLocation(trimToDefault(request.getDeliveryLocation(), "Admin entered delivery"));
        order.setDeliveryMethod("LEAVE_AND_PHOTO".equals(request.getDeliveryMethod()) ? "LEAVE_AND_PHOTO" : "PIN_IN_PERSON");
        order.setDeliveryPin("PIN_IN_PERSON".equals(order.getDeliveryMethod()) ? "0000" : null);
        order.setDeliveryProofStatus("LEAVE_AND_PHOTO".equals(order.getDeliveryMethod()) ? "PHOTO_REQUIRED" : "PIN_REQUIRED");
        order.setTimeWindowLabel(trimToDefault(request.getTimeWindowLabel(), "Admin scheduled"));
        order.setTotalFee(BigDecimal.valueOf(points));
        order.setPointsCost(points);
        order.setStatus(status);
        order.setStatusLabel(resolveStatusLabel(status));
        order.setCustomerConfirmedAt("DELIVERED".equals(status) ? LocalDateTime.now() : null);
        return order;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null || status.trim().isEmpty() ? "PLACED" : status.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PLACED", "ACCEPTED", "PICKED_UP", "AWAITING_CUSTOMER_CONFIRMATION", "DELIVERED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN" -> normalized;
            default -> throw new BusinessException("Unsupported order status.");
        };
    }

    private String resolveStatusLabel(String status) {
        return switch (status) {
            case "PLACED" -> "Placed";
            case "ACCEPTED" -> "Accepted";
            case "PICKED_UP" -> "Picked Up";
            case "AWAITING_CUSTOMER_CONFIRMATION" -> "Awaiting Customer Confirmation";
            case "DELIVERED" -> "Delivered";
            case "CANCELLED_BY_CUSTOMER" -> "Cancelled by Customer";
            case "CANCELLED_BY_ADMIN" -> "Cancelled by Admin";
            default -> status;
        };
    }
}
