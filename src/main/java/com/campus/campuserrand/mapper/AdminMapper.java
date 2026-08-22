package com.campus.campuserrand.mapper;

import com.campus.campuserrand.dto.AdminStatsResponse;
import com.campus.campuserrand.entity.ErrandOrder;
import com.campus.campuserrand.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminMapper {
    List<User> findAllUsers();

    int insertAdminUser(User user);

    int updateAdminUser(User user);

    int deleteUser(@Param("userId") Long userId);

    List<ErrandOrder> findAllOrders();

    int insertAdminOrder(ErrandOrder order);

    int updateAdminOrder(ErrandOrder order);

    int deleteOrder(@Param("orderNo") String orderNo);

    List<ErrandOrder> findReviewOrders();

    AdminStatsResponse loadStats();

    int updateUserRoleAndPoints(@Param("userId") Long userId, @Param("role") String role, @Param("points") Integer points);

    int approveRunnerApplication(@Param("userId") Long userId);

    int rejectRunnerApplication(@Param("userId") Long userId);

    int cancelOrderByAdmin(@Param("orderNo") String orderNo, @Param("reason") String reason);

    int resolveAppeal(@Param("orderNo") String orderNo, @Param("resolution") String resolution);
}
