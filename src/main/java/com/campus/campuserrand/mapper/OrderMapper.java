package com.campus.campuserrand.mapper;

import com.campus.campuserrand.entity.ErrandOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrderMapper {
    int insertOrder(ErrandOrder order);

    List<ErrandOrder> findOrdersByUserId(@Param("userId") Long userId);

    ErrandOrder findOrderByOrderNoAndUserId(@Param("orderNo") String orderNo, @Param("userId") Long userId);

    int updateOrderStatus(ErrandOrder order);

    int updateDeliveryCompletion(ErrandOrder order);

    List<ErrandOrder> findAvailableOrders(@Param("runnerId") Long runnerId);

    List<ErrandOrder> findOrdersByRunnerId(@Param("runnerId") Long runnerId);

    ErrandOrder findOrderByOrderNo(@Param("orderNo") String orderNo);

    int acceptOrder(@Param("id") Long id, @Param("runnerId") Long runnerId, @Param("status") String status, @Param("statusLabel") String statusLabel);

    ErrandOrder findOrderByOrderNoAndRunnerId(@Param("orderNo") String orderNo, @Param("runnerId") Long runnerId);

    List<ErrandOrder> findOrdersReadyForPointsTransfer();

    int giveUpOrder(@Param("id") Long id, @Param("runnerId") Long runnerId);

    int cancelOrderByCustomer(@Param("id") Long id, @Param("userId") Long userId, @Param("reason") String reason);

    int confirmPhotoProofOrder(@Param("id") Long id, @Param("userId") Long userId);

    int submitOrderReview(@Param("id") Long id, @Param("userId") Long userId, @Param("runnerScore") Integer runnerScore, @Param("comment") String comment);

    int submitAppeal(@Param("id") Long id, @Param("reason") String reason);

    int autoConfirmTimedOutOrders(@Param("deadline") LocalDateTime deadline);

    int markPointsTransferred(@Param("orderId") Long orderId);

    int countIncompleteRunnerOrders(@Param("runnerId") Long runnerId);
}
