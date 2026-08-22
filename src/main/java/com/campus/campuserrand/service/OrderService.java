package com.campus.campuserrand.service;

import com.campus.campuserrand.dto.CreateOrderRequest;
import com.campus.campuserrand.dto.OrderResponse;
import com.campus.campuserrand.entity.ErrandOrder;
import com.campus.campuserrand.entity.User;
import com.campus.campuserrand.entity.UserSession;
import com.campus.campuserrand.exception.BusinessException;
import com.campus.campuserrand.mapper.AuthMapper;
import com.campus.campuserrand.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class OrderService {

    private static final long MAX_PHOTO_PROOF_SIZE = 5L * 1024L * 1024L;
    private static final Map<String, String> PHOTO_EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private static final int PHOTO_PROOF_AUTO_CONFIRM_HOURS = 12;
    private static final int CUSTOMER_ACCEPTED_CANCEL_PENALTY = 1;
    private static final int RUNNER_GIVE_UP_PENALTY = 2;
    private static final int BAN_DAYS = 3;
    private static final BigDecimal FIXED_LOCATION_FEE = new BigDecimal("2.00");
    private static final BigDecimal WEEKLY_CARD_DISCOUNT = new BigDecimal("2.00");

    private final AuthMapper authMapper;
    private final OrderMapper orderMapper;
    private final Path uploadDirectory;
    private final SecureRandom secureRandom = new SecureRandom();

    public OrderService(AuthMapper authMapper, OrderMapper orderMapper,
                        @Value("${app.upload.directory:uploads}") String uploadDirectory) {
        this.authMapper = authMapper;
        this.orderMapper = orderMapper;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Transactional
    public OrderResponse createOrder(String authorizationHeader, CreateOrderRequest request) {
        User user = loadCurrentUser(authorizationHeader);
        validateRequest(request);
        autoConfirmTimedOutPhotoProofOrders();

        ErrandOrder order = new ErrandOrder();
        order.setUserId(user.getId());
        order.setOrderNo(generateOrderNo());
        order.setOrderType(request.getOrderType());
        order.setOrderTypeLabel(resolveOrderTypeLabel(request.getOrderType()));
        order.setPickupMethod(request.getPickupMethod());
        order.setPickupLocation(request.getPickupLocation().trim());
        order.setPickupNotes(request.getPickupNotes().trim());
        order.setDeliveryLocation(request.getDeliveryLocation().trim());
        order.setDeliveryMethod(request.getDeliveryMethod());
        order.setDeliveryPin("PIN_IN_PERSON".equals(request.getDeliveryMethod()) ? generatePin() : null);
        order.setDeliveryProofStatus("LEAVE_AND_PHOTO".equals(request.getDeliveryMethod()) ? "PHOTO_REQUIRED" : "PIN_REQUIRED");
        order.setPhotoProofUrl(null);
        order.setPhotoProofNote(null);
        order.setTimeWindowType(request.getTimeWindowType());
        order.setTimeWindowLabel(resolveTimeWindowLabel(request.getTimeWindowType(), request.getPreferredLatestTime()));
        order.setPreferredLatestTime(parsePreferredLatestTime(request.getTimeWindowType(), request.getPreferredLatestTime()));

        BigDecimal baseFee = new BigDecimal("3.00");
        BigDecimal distanceFee = FIXED_LOCATION_FEE;
        BigDecimal urgencyFee = resolveUrgencyFee(request.getTimeWindowType());
        BigDecimal tipFee = normalizeMoney(request.getOptionalTip());
        BigDecimal weeklyCardDiscount = isWeeklyCardActive(user) ? WEEKLY_CARD_DISCOUNT : BigDecimal.ZERO;
        BigDecimal totalFee = baseFee.add(distanceFee).add(urgencyFee).add(tipFee).subtract(weeklyCardDiscount).max(BigDecimal.ONE);
        int pointsCost = totalFee.intValue();

        int deducted = authMapper.deductPointsIfEnough(user.getId(), pointsCost);
        if (deducted == 0) {
            throw new BusinessException("You do not have enough points to place this order.");
        }

        order.setBaseFee(baseFee);
        order.setDistanceFee(distanceFee);
        order.setUrgencyFee(urgencyFee);
        order.setComplexityFee(BigDecimal.ZERO);
        order.setTipFee(tipFee);
        order.setWeeklyCardDiscountFee(weeklyCardDiscount);
        order.setTotalFee(totalFee);
        order.setPointsCost(pointsCost);
        order.setPointsTransferredAt(null);
        order.setStatus("PLACED");
        order.setStatusLabel("Placed");

        orderMapper.insertOrder(order);
        User customerAfterDeduction = authMapper.findUserById(user.getId());
        recordPointChange(
                customerAfterDeduction,
                -pointsCost,
                "ORDER_PAYMENT",
                "Points deducted for order " + order.getOrderNo() + ".",
                order.getOrderNo()
        );
        settleDeliveredOrders();

        OrderResponse response = new OrderResponse();
        response.setMessage("Order created successfully. The required points have been deducted from your account.");
        response.setOrder(orderMapper.findOrderByOrderNoAndUserId(order.getOrderNo(), user.getId()));
        return response;
    }

    public List<ErrandOrder> listCurrentUserOrders(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        return orderMapper.findOrdersByUserId(user.getId());
    }

    public List<ErrandOrder> listAvailableOrdersForRunner(String authorizationHeader, String sort) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        List<ErrandOrder> orders = orderMapper.findAvailableOrders(runner.getId());
        orders.forEach(order -> order.setCustomerPhone(null));
        sortAvailableOrders(orders, sort);
        return orders;
    }

    public List<ErrandOrder> listRunnerOrders(String authorizationHeader) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        return orderMapper.findOrdersByRunnerId(runner.getId());
    }

    public ErrandOrder getCurrentUserOrder(String authorizationHeader, String orderNo) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId());
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        return order;
    }

    @Transactional
    public OrderResponse acceptOrder(String authorizationHeader, String orderNo) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNo(orderNo);
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        if (!"PLACED".equals(order.getStatus()) || order.getRunnerId() != null) {
            throw new BusinessException("This order is no longer available.");
        }
        if (order.getUserId().equals(runner.getId())) {
            throw new BusinessException("You cannot accept your own order.");
        }

        int updated = orderMapper.acceptOrder(order.getId(), runner.getId(), "ACCEPTED", "Accepted");
        if (updated == 0) {
            throw new BusinessException("This order has already been accepted by another runner.");
        }

        OrderResponse response = new OrderResponse();
        response.setMessage("Order accepted successfully.");
        response.setOrder(orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId()));
        return response;
    }

    @Transactional
    public OrderResponse advanceRunnerOrderStatus(String authorizationHeader, String orderNo, String deliveryPinInput, String photoProofUrl, String photoProofNote) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId());
        if (order == null) {
            throw new BusinessException("Runner order not found.");
        }
        if ("PLACED".equals(order.getStatus())) {
            throw new BusinessException("Please accept the order first.");
        }

        String nextStatus = resolveRunnerNextStatus(order.getStatus());
        if (nextStatus == null) {
            throw new BusinessException("This runner order is already completed.");
        }

        if ("PICKED_UP".equals(nextStatus)) {
            order.setStatus(nextStatus);
            order.setStatusLabel(resolveStatusLabel(nextStatus));
            orderMapper.updateOrderStatus(order);
        } else if ("DELIVERED".equals(nextStatus) && "PIN_IN_PERSON".equals(order.getDeliveryMethod())) {
            if (isBlank(deliveryPinInput)) {
                throw new BusinessException("Please enter the customer's delivery PIN before completing the order.");
            }
            if (!deliveryPinInput.trim().equals(order.getDeliveryPin())) {
                throw new BusinessException("The PIN is incorrect. Delivery cannot be completed.");
            }
            order.setStatus(nextStatus);
            order.setStatusLabel(resolveStatusLabel(nextStatus));
            order.setDeliveryProofStatus("PIN_VERIFIED");
            order.setCustomerConfirmedAt(LocalDateTime.now());
            orderMapper.updateDeliveryCompletion(order);
            settleDeliveredOrders();
        } else if ("DELIVERED".equals(nextStatus) && "LEAVE_AND_PHOTO".equals(order.getDeliveryMethod())) {
            if (isBlank(photoProofUrl) && isBlank(photoProofNote)) {
                throw new BusinessException("Please provide photo proof details before completing this delivery.");
            }
            order.setStatus("AWAITING_CUSTOMER_CONFIRMATION");
            order.setStatusLabel("Awaiting Customer Confirmation");
            order.setDeliveryProofStatus("PHOTO_UPLOADED");
            order.setPhotoProofUrl(trimToNull(photoProofUrl));
            order.setPhotoProofNote(trimToNull(photoProofNote));
            orderMapper.updateDeliveryCompletion(order);
        } else {
            order.setStatus(nextStatus);
            order.setStatusLabel(resolveStatusLabel(nextStatus));
            orderMapper.updateOrderStatus(order);
        }

        OrderResponse response = new OrderResponse();
        response.setMessage("Runner order status updated.");
        response.setOrder(orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId()));
        return response;
    }

    @Transactional
    public OrderResponse uploadPhotoProofAndComplete(String authorizationHeader, String orderNo, MultipartFile file, String note) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        ErrandOrder order = orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId());
        if (order == null) {
            throw new BusinessException("Runner order not found.");
        }
        if (!"PICKED_UP".equals(order.getStatus()) || !"LEAVE_AND_PHOTO".equals(order.getDeliveryMethod())) {
            throw new BusinessException("Photo proof can only be uploaded for a picked-up photo-delivery order.");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Please select a delivery photo.");
        }
        if (file.getSize() > MAX_PHOTO_PROOF_SIZE) {
            throw new BusinessException("The delivery photo must be 5 MB or smaller.");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String extension = PHOTO_EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new BusinessException("Only JPG, PNG, WebP, or GIF images can be uploaded.");
        }
        String normalizedNote = trimToNull(note);
        if (normalizedNote != null && normalizedNote.length() > 500) {
            throw new BusinessException("The photo description must be 500 characters or fewer.");
        }

        Path proofDirectory = uploadDirectory.resolve("photo-proofs").normalize();
        Path storedFile = proofDirectory.resolve(orderNo + "-" + UUID.randomUUID() + extension).normalize();
        if (!storedFile.startsWith(proofDirectory)) {
            throw new BusinessException("Invalid upload path.");
        }

        try {
            Files.createDirectories(proofDirectory);
            Files.copy(file.getInputStream(), storedFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BusinessException("The delivery photo could not be saved. Please try again.");
        }

        try {
            order.setStatus("AWAITING_CUSTOMER_CONFIRMATION");
            order.setStatusLabel("Awaiting Customer Confirmation");
            order.setDeliveryProofStatus("PHOTO_UPLOADED");
            order.setPhotoProofUrl("/uploads/photo-proofs/" + storedFile.getFileName());
            order.setPhotoProofNote(normalizedNote);
            orderMapper.updateDeliveryCompletion(order);

            OrderResponse response = new OrderResponse();
            response.setMessage("Delivery photo uploaded successfully.");
            response.setOrder(orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId()));
            return response;
        } catch (RuntimeException exception) {
            try {
                Files.deleteIfExists(storedFile);
            } catch (IOException ignored) {
                // Keep the original database error.
            }
            throw exception;
        }
    }

    @Transactional
    public OrderResponse cancelOrder(String authorizationHeader, String orderNo, String reason) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId());
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        if (!"PLACED".equals(order.getStatus()) && !"ACCEPTED".equals(order.getStatus())) {
            throw new BusinessException("This order can no longer be cancelled.");
        }

        int updated = orderMapper.cancelOrderByCustomer(order.getId(), user.getId(), trimToNull(reason));
        if (updated == 0) {
            throw new BusinessException("Unable to cancel this order now.");
        }
        applyCustomerCancelPenaltyIfNeeded(user, order);
        refundCustomerPointsIfNeeded(order);

        OrderResponse response = new OrderResponse();
        response.setMessage("Order cancelled successfully. The deducted points have been returned to your account.");
        response.setOrder(orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId()));
        return response;
    }

    @Transactional
    public OrderResponse giveUpOrder(String authorizationHeader, String orderNo, String reason) {
        User runner = ensureRunner(loadCurrentUser(authorizationHeader));
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndRunnerId(orderNo, runner.getId());
        if (order == null) {
            throw new BusinessException("Runner order not found.");
        }
        if (!"ACCEPTED".equals(order.getStatus())) {
            throw new BusinessException("Only accepted orders can be given up.");
        }

        int updated = orderMapper.giveUpOrder(order.getId(), runner.getId());
        if (updated == 0) {
            throw new BusinessException("Unable to give up this order now.");
        }
        applyRunnerGiveUpPenalty(runner);

        OrderResponse response = new OrderResponse();
        response.setMessage(isBlank(reason)
                ? "Order returned to the available hall. A 2-point reliability penalty has been applied."
                : "Order returned to the available hall. Reason recorded and a 2-point reliability penalty has been applied.");
        response.setOrder(orderMapper.findOrderByOrderNo(orderNo));
        return response;
    }

    @Transactional
    public OrderResponse submitAppeal(String authorizationHeader, String orderNo, String reason) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNo(orderNo);
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        boolean customer = order.getUserId() != null && order.getUserId().equals(user.getId());
        boolean runner = order.getRunnerId() != null && order.getRunnerId().equals(user.getId());
        if (!customer && !runner) {
            throw new BusinessException("Only the customer or assigned runner can appeal this order.");
        }
        if (!"DELIVERED".equals(order.getStatus())) {
            throw new BusinessException("Only completed orders can be appealed.");
        }
        if (isBlank(reason)) {
            throw new BusinessException("Please enter an appeal reason.");
        }
        if ("OPEN".equalsIgnoreCase(order.getAppealStatus())) {
            throw new BusinessException("This order already has an open appeal.");
        }
        if ("RESOLVED".equalsIgnoreCase(order.getAppealStatus())) {
            throw new BusinessException("This order already has a resolved appeal and cannot be appealed again.");
        }
        int updated = orderMapper.submitAppeal(order.getId(), reason.trim());
        if (updated == 0) {
            throw new BusinessException("Unable to submit this appeal right now.");
        }

        OrderResponse response = new OrderResponse();
        response.setMessage("Appeal submitted. An administrator can review it from the admin console.");
        response.setOrder(customer
                ? orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId())
                : orderMapper.findOrderByOrderNoAndRunnerId(orderNo, user.getId()));
        return response;
    }

    @Transactional
    public OrderResponse confirmPhotoProofReceipt(String authorizationHeader, String orderNo) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId());
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        if (!"AWAITING_CUSTOMER_CONFIRMATION".equals(order.getStatus())) {
            throw new BusinessException("This order is not waiting for customer confirmation.");
        }

        int updated = orderMapper.confirmPhotoProofOrder(order.getId(), user.getId());
        if (updated == 0) {
            throw new BusinessException("Unable to confirm this order right now.");
        }
        settleDeliveredOrders();

        OrderResponse response = new OrderResponse();
        response.setMessage("Receipt confirmed. The order is now completed and the points have been settled to the runner.");
        response.setOrder(orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId()));
        return response;
    }

    @Transactional
    public OrderResponse submitOrderReview(String authorizationHeader, String orderNo, Integer runnerScore, String comment) {
        User user = loadCurrentUser(authorizationHeader);
        autoConfirmTimedOutPhotoProofOrders();
        settleDeliveredOrders();
        ErrandOrder order = orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId());
        if (order == null) {
            throw new BusinessException("Order not found.");
        }
        if (!"DELIVERED".equals(order.getStatus())) {
            throw new BusinessException("Only completed orders can be reviewed.");
        }
        if (order.getRunnerReviewScore() != null) {
            throw new BusinessException("This order has already been reviewed.");
        }
        if (runnerScore == null || runnerScore < 1 || runnerScore > 5) {
            throw new BusinessException("Please choose a runner score from 1 to 5.");
        }
        if (comment == null || comment.trim().isEmpty()) {
            throw new BusinessException("Please enter your review comment.");
        }

        int updated = orderMapper.submitOrderReview(order.getId(), user.getId(), runnerScore, comment.trim());
        if (updated == 0) {
            throw new BusinessException("Unable to submit the review right now.");
        }

        OrderResponse response = new OrderResponse();
        response.setMessage("Review submitted successfully.");
        response.setOrder(orderMapper.findOrderByOrderNoAndUserId(orderNo, user.getId()));
        return response;
    }

    private void validateRequest(CreateOrderRequest request) {
        if (request == null) {
            throw new BusinessException("Order request is required.");
        }
        if (isBlank(request.getOrderType())) {
            throw new BusinessException("Please choose an order type.");
        }
        if (!isSupportedOrderType(request.getOrderType())) {
            throw new BusinessException("Unsupported order type.");
        }
        if (isBlank(request.getPickupMethod())) {
            throw new BusinessException("Please choose how to provide the pickup location.");
        }
        if (!"CURRENT_LOCATION".equals(request.getPickupMethod()) && !"MANUAL_ENTRY".equals(request.getPickupMethod())) {
            throw new BusinessException("Unsupported pickup location method.");
        }
        if (isBlank(request.getPickupLocation())) {
            throw new BusinessException("Pickup location is required.");
        }
        if (isBlank(request.getPickupNotes())) {
            throw new BusinessException("Pickup notes are required.");
        }
        if (isBlank(request.getDeliveryLocation())) {
            throw new BusinessException("Delivery location is required.");
        }
        if (isBlank(request.getDeliveryMethod())) {
            throw new BusinessException("Please choose a delivery method.");
        }
        if (!"PIN_IN_PERSON".equals(request.getDeliveryMethod()) && !"LEAVE_AND_PHOTO".equals(request.getDeliveryMethod())) {
            throw new BusinessException("Unsupported delivery method.");
        }
        if (isBlank(request.getTimeWindowType())) {
            throw new BusinessException("Please choose a time window.");
        }
        if (!"ASAP".equals(request.getTimeWindowType()) && !"WITHIN_ONE_HOUR".equals(request.getTimeWindowType()) && !"TODAY_BEFORE".equals(request.getTimeWindowType())) {
            throw new BusinessException("Unsupported time window.");
        }
        if ("TODAY_BEFORE".equals(request.getTimeWindowType()) && isBlank(request.getPreferredLatestTime())) {
            throw new BusinessException("Please choose the latest delivery time for today.");
        }
        if (request.getOptionalTip() != null && request.getOptionalTip().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Tip cannot be negative.");
        }
    }

    private User loadCurrentUser(String authorizationHeader) {
        UserSession session = findActiveSession(authorizationHeader);
        User user = authMapper.findUserById(session.getUserId());
        if (user == null) {
            throw new BusinessException("Current user does not exist.");
        }
        ensureNotBanned(user);
        return user;
    }

    private User ensureRunner(User user) {
        if (user == null || !"RUNNER".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Runner access is required.");
        }
        return user;
    }

    private void ensureNotBanned(User user) {
        if (user != null && Boolean.TRUE.equals(user.getBanned())) {
            LocalDateTime banEndsAt = user.getBannedAt() == null ? null : user.getBannedAt().plusDays(BAN_DAYS);
            if (banEndsAt != null && !banEndsAt.isAfter(LocalDateTime.now())) {
                authMapper.unbanUser(user.getId());
                return;
            }
            String remaining = "Please try again after the 3-day ban period.";
            if (banEndsAt != null) {
                long hours = Math.max(1, Duration.between(LocalDateTime.now(), banEndsAt).toHours() + 1);
                long days = Math.max(1, (hours + 23) / 24);
                remaining = "You can use the system again in about " + days + " day" + (days == 1 ? "" : "s") + ".";
            }
            throw new BusinessException("This account is banned for 3 days and cannot use order services. " + remaining);
        }
    }

    private void applyCustomerCancelPenaltyIfNeeded(User user, ErrandOrder order) {
        authMapper.incrementCancellationCount(user.getId());
        if ("ACCEPTED".equals(order.getStatus())) {
            User beforePenalty = authMapper.findUserById(user.getId());
            authMapper.deductPenaltyPoints(user.getId(), CUSTOMER_ACCEPTED_CANCEL_PENALTY);
            User afterPenalty = authMapper.findUserById(user.getId());
            recordPointChange(
                    afterPenalty,
                    -Math.min(CUSTOMER_ACCEPTED_CANCEL_PENALTY, beforePenalty == null || beforePenalty.getPoints() == null ? 0 : beforePenalty.getPoints()),
                    "CANCEL_PENALTY",
                    "Penalty for cancelling an accepted order.",
                    order.getOrderNo()
            );
        }
    }

    private void applyRunnerGiveUpPenalty(User runner) {
        authMapper.incrementRunnerGiveUpCount(runner.getId());
        User beforePenalty = authMapper.findUserById(runner.getId());
        authMapper.deductPenaltyPoints(runner.getId(), RUNNER_GIVE_UP_PENALTY);
        User refreshed = authMapper.findUserById(runner.getId());
        recordPointChange(
                refreshed,
                -Math.min(RUNNER_GIVE_UP_PENALTY, beforePenalty == null || beforePenalty.getPoints() == null ? 0 : beforePenalty.getPoints()),
                "GIVE_UP_PENALTY",
                "Penalty for giving up an accepted order.",
                null
        );
    }

    private void sortAvailableOrders(List<ErrandOrder> orders, String sort) {
        String normalized = sort == null ? "NEWEST" : sort.trim().toUpperCase(Locale.ROOT);
        Comparator<ErrandOrder> comparator = switch (normalized) {
            case "POINTS_HIGH" -> Comparator.comparing((ErrandOrder order) -> order.getPointsCost() == null ? 0 : order.getPointsCost()).reversed();
            case "URGENT" -> Comparator.comparingInt(this::urgencyRank).thenComparing(ErrandOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
            case "TYPE" -> Comparator.comparing(order -> order.getOrderTypeLabel() == null ? "" : order.getOrderTypeLabel());
            default -> Comparator.comparing(ErrandOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        };
        orders.sort(comparator);
    }

    private int urgencyRank(ErrandOrder order) {
        if (order == null || order.getTimeWindowType() == null) {
            return 9;
        }
        return switch (order.getTimeWindowType()) {
            case "ASAP" -> 0;
            case "WITHIN_ONE_HOUR" -> 1;
            case "TODAY_BEFORE" -> 2;
            default -> 9;
        };
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

    private boolean isSupportedOrderType(String value) {
        return "COLLECTION_TASK".equals(value)
                || "DELIVERY_DROPOFF_TASK".equals(value);
    }

    private String resolveRunnerNextStatus(String status) {
        return switch (status) {
            case "ACCEPTED" -> "PICKED_UP";
            case "PICKED_UP" -> "DELIVERED";
            default -> null;
        };
    }

    private String resolveStatusLabel(String status) {
        return switch (status) {
            case "PLACED" -> "Placed";
            case "ACCEPTED" -> "Accepted";
            case "PICKED_UP" -> "Picked Up";
            case "DELIVERED" -> "Delivered";
            default -> "Placed";
        };
    }

    private String resolveOrderTypeLabel(String value) {
        return switch (value) {
            case "COLLECTION_TASK" -> "Parcel Collect";
            case "DELIVERY_DROPOFF_TASK" -> "Item Pickup";
            default -> "Campus Errand";
        };
    }

    private String resolveTimeWindowLabel(String type, String preferredLatestTime) {
        return switch (type) {
            case "ASAP" -> "ASAP";
            case "WITHIN_ONE_HOUR" -> "Within 1 hour";
            case "TODAY_BEFORE" -> "Today before " + preferredLatestTime;
            default -> "Flexible";
        };
    }

    private LocalDateTime parsePreferredLatestTime(String type, String preferredLatestTime) {
        if (!"TODAY_BEFORE".equals(type) || isBlank(preferredLatestTime)) {
            return null;
        }
        try {
            return LocalDateTime.of(LocalDate.now(), LocalTime.parse(preferredLatestTime));
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Latest delivery time is invalid.");
        }
    }

    private BigDecimal resolveUrgencyFee(String timeWindowType) {
        return switch (timeWindowType) {
            case "ASAP" -> new BigDecimal("2.00");
            case "WITHIN_ONE_HOUR" -> new BigDecimal("1.00");
            default -> BigDecimal.ZERO;
        };
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(0, RoundingMode.HALF_UP);
        }
        return value.max(BigDecimal.ZERO).setScale(0, RoundingMode.HALF_UP);
    }

    private String generateOrderNo() {
        return "CE" + System.currentTimeMillis();
    }

    private String generatePin() {
        return String.format("%04d", secureRandom.nextInt(10_000));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isWeeklyCardActive(User user) {
        return user != null && user.getWeeklyCardExpiresAt() != null && user.getWeeklyCardExpiresAt().isAfter(LocalDateTime.now());
    }

    private void autoConfirmTimedOutPhotoProofOrders() {
        orderMapper.autoConfirmTimedOutOrders(LocalDateTime.now().minusHours(PHOTO_PROOF_AUTO_CONFIRM_HOURS));
    }

    private void settleDeliveredOrders() {
        List<ErrandOrder> readyOrders = orderMapper.findOrdersReadyForPointsTransfer();
        for (ErrandOrder readyOrder : readyOrders) {
            if (readyOrder.getRunnerId() == null || readyOrder.getPointsCost() == null || readyOrder.getPointsCost() <= 0) {
                continue;
            }
            int updated = orderMapper.markPointsTransferred(readyOrder.getId());
            if (updated > 0) {
                authMapper.addPoints(readyOrder.getRunnerId(), readyOrder.getPointsCost());
                User runner = authMapper.findUserById(readyOrder.getRunnerId());
                recordPointChange(
                        runner,
                        readyOrder.getPointsCost(),
                        "RUNNER_SETTLEMENT",
                        "Runner settlement for completed order " + readyOrder.getOrderNo() + ".",
                        readyOrder.getOrderNo()
                );
            }
        }
    }

    private void refundCustomerPointsIfNeeded(ErrandOrder order) {
        if (order == null || order.getPointsCost() == null || order.getPointsCost() <= 0) {
            return;
        }
        if (order.getPointsTransferredAt() != null) {
            return;
        }
        authMapper.addPoints(order.getUserId(), order.getPointsCost());
        User customer = authMapper.findUserById(order.getUserId());
        recordPointChange(
                customer,
                order.getPointsCost(),
                "ORDER_REFUND",
                "Refund for cancelled order " + order.getOrderNo() + ".",
                order.getOrderNo()
        );
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
}
