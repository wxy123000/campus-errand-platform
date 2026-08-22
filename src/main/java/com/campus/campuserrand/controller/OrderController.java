package com.campus.campuserrand.controller;

import com.campus.campuserrand.dto.CreateOrderRequest;
import com.campus.campuserrand.dto.OrderAppealRequest;
import com.campus.campuserrand.dto.OrderActionRequest;
import com.campus.campuserrand.dto.OrderReviewRequest;
import com.campus.campuserrand.dto.OrderResponse;
import com.campus.campuserrand.dto.RunnerDeliveryRequest;
import com.campus.campuserrand.entity.ErrandOrder;
import com.campus.campuserrand.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse createOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody CreateOrderRequest request
    ) {
        return orderService.createOrder(authorizationHeader, request);
    }

    @GetMapping
    public List<ErrandOrder> listCurrentUserOrders(@RequestHeader("Authorization") String authorizationHeader) {
        return orderService.listCurrentUserOrders(authorizationHeader);
    }

    @GetMapping("/runner/available")
    public List<ErrandOrder> listAvailableRunnerOrders(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(value = "sort", required = false) String sort
    ) {
        return orderService.listAvailableOrdersForRunner(authorizationHeader, sort);
    }

    @GetMapping("/runner/my")
    public List<ErrandOrder> listRunnerOrders(@RequestHeader("Authorization") String authorizationHeader) {
        return orderService.listRunnerOrders(authorizationHeader);
    }

    @GetMapping("/{orderNo}")
    public ErrandOrder getCurrentUserOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo
    ) {
        return orderService.getCurrentUserOrder(authorizationHeader, orderNo);
    }

    @PostMapping("/{orderNo}/accept")
    public OrderResponse acceptOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo
    ) {
        return orderService.acceptOrder(authorizationHeader, orderNo);
    }

    @PostMapping("/{orderNo}/runner-advance")
    public OrderResponse advanceRunnerOrderStatus(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody(required = false) RunnerDeliveryRequest request
    ) {
        return orderService.advanceRunnerOrderStatus(
                authorizationHeader,
                orderNo,
                request == null ? null : request.getPin(),
                request == null ? null : request.getPhotoProofUrl(),
                request == null ? null : request.getPhotoProofNote()
        );
    }

    @PostMapping("/{orderNo}/photo-proof")
    public OrderResponse uploadPhotoProof(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "note", required = false) String note
    ) {
        return orderService.uploadPhotoProofAndComplete(authorizationHeader, orderNo, file, note);
    }

    @PostMapping("/{orderNo}/cancel")
    public OrderResponse cancelOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody(required = false) OrderActionRequest request
    ) {
        return orderService.cancelOrder(authorizationHeader, orderNo, request == null ? null : request.getReason());
    }

    @PostMapping("/{orderNo}/give-up")
    public OrderResponse giveUpOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody(required = false) OrderActionRequest request
    ) {
        return orderService.giveUpOrder(authorizationHeader, orderNo, request == null ? null : request.getReason());
    }

    @PostMapping("/{orderNo}/confirm-receipt")
    public OrderResponse confirmReceipt(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo
    ) {
        return orderService.confirmPhotoProofReceipt(authorizationHeader, orderNo);
    }

    @PostMapping("/{orderNo}/review")
    public OrderResponse submitReview(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody OrderReviewRequest request
    ) {
        return orderService.submitOrderReview(
                authorizationHeader,
                orderNo,
                request.getRunnerScore(),
                request.getComment()
        );
    }

    @PostMapping("/{orderNo}/appeal")
    public OrderResponse submitAppeal(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable("orderNo") String orderNo,
            @RequestBody OrderAppealRequest request
    ) {
        return orderService.submitAppeal(authorizationHeader, orderNo, request == null ? null : request.getReason());
    }
}
