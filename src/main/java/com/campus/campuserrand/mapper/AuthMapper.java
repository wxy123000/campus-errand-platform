package com.campus.campuserrand.mapper;

import com.campus.campuserrand.dto.InviteRecordItem;
import com.campus.campuserrand.entity.PointTransaction;
import com.campus.campuserrand.entity.User;
import com.campus.campuserrand.entity.UserSession;
import com.campus.campuserrand.entity.VerificationCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AuthMapper {
    User findUserByEmail(@Param("email") String email);

    int insertUser(User user);

    int updateUser(User user);

    int insertVerificationCode(VerificationCode verificationCode);

    int deleteVerificationCodes(@Param("email") String email, @Param("purpose") String purpose);

    VerificationCode findLatestCode(@Param("email") String email, @Param("purpose") String purpose);

    int markCodeUsed(@Param("id") Long id);

    int insertSession(UserSession session);

    UserSession findSessionByToken(@Param("token") String token);

    User findUserById(@Param("id") Long id);

    int deleteSessionsByUserId(@Param("userId") Long userId);

    int updateProfile(User user);

    User findUserByInviteCode(@Param("inviteCode") String inviteCode);

    int addPoints(@Param("userId") Long userId, @Param("points") int points);

    int deductPointsIfEnough(@Param("userId") Long userId, @Param("points") int points);

    int claimWeeklyPoints(@Param("userId") Long userId, @Param("points") int points);

    int activateWeeklyCard(@Param("userId") Long userId, @Param("cost") int cost, @Param("expiresAt") LocalDateTime expiresAt);

    List<InviteRecordItem> findInviteRecordsByUserId(@Param("userId") Long userId);

    List<PointTransaction> findPointTransactionsByUserId(@Param("userId") Long userId);

    int insertPointTransaction(
            @Param("userId") Long userId,
            @Param("changeAmount") int changeAmount,
            @Param("balanceAfter") int balanceAfter,
            @Param("transactionType") String transactionType,
            @Param("description") String description,
            @Param("orderNo") String orderNo
    );

    int updateUserRole(@Param("userId") Long userId, @Param("role") String role);

    int updateRunnerApplicationStatus(@Param("userId") Long userId, @Param("status") String status);

    int incrementCancellationCount(@Param("userId") Long userId);

    int incrementRunnerGiveUpCount(@Param("userId") Long userId);

    int deductPenaltyPoints(@Param("userId") Long userId, @Param("points") int points);

    int banUser(@Param("userId") Long userId, @Param("reason") String reason);

    int unbanUser(@Param("userId") Long userId);
}
