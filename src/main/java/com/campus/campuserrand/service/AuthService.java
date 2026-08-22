package com.campus.campuserrand.service;

import com.campus.campuserrand.dto.AuthResponse;
import com.campus.campuserrand.dto.InviteRecordItem;
import com.campus.campuserrand.dto.InviteRecordResponse;
import com.campus.campuserrand.dto.LoginRequest;
import com.campus.campuserrand.dto.RegisterRequest;
import com.campus.campuserrand.dto.SendCodeRequest;
import com.campus.campuserrand.dto.UpdateProfileRequest;
import com.campus.campuserrand.entity.User;
import com.campus.campuserrand.entity.PointTransaction;
import com.campus.campuserrand.entity.UserSession;
import com.campus.campuserrand.entity.VerificationCode;
import com.campus.campuserrand.exception.BusinessException;
import com.campus.campuserrand.mapper.AuthMapper;
import com.campus.campuserrand.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final String LEEDS_SUFFIX = "@leeds.ac.uk";
    private static final String REGISTER_PURPOSE = "REGISTER";
    private static final int INITIAL_SIGNUP_POINTS = 20;
    private static final int INVITE_REWARD_POINTS = 25;
    private static final int WEEKLY_MONDAY_POINTS = 15;
    private static final int WEEKLY_CARD_COST = 10;
    private static final int BAN_DAYS = 3;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final AuthMapper authMapper;
    private final OrderMapper orderMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(AuthMapper authMapper, OrderMapper orderMapper) {
        this.authMapper = authMapper;
        this.orderMapper = orderMapper;
    }

    @Transactional
    public Map<String, Object> sendRegisterCode(SendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        ensureLeedsEmail(email);

        User existingUser = authMapper.findUserByEmail(email);
        if (existingUser != null && Boolean.TRUE.equals(existingUser.getVerified())) {
            throw new BusinessException("This Leeds email has already been registered. Please sign in directly.");
        }

        VerificationCode previousCode = authMapper.findLatestCode(email, REGISTER_PURPOSE);
        if (previousCode != null && previousCode.getCreatedAt() != null
                && previousCode.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(60))) {
            throw new BusinessException("Please wait 60 seconds before requesting another verification code.");
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setPurpose(REGISTER_PURPOSE);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        authMapper.deleteVerificationCodes(email, REGISTER_PURPOSE);
        authMapper.insertVerificationCode(verificationCode);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Demo verification code generated. No email was sent.");
        response.put("demoMode", true);
        response.put("demoCode", code);
        response.put("email", email);
        response.put("expiresAt", verificationCode.getExpiresAt().format(FORMATTER));
        return response;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        ensureLeedsEmail(email);
        validateRegisterRequest(request);

        VerificationCode latestCode = authMapper.findLatestCode(email, REGISTER_PURPOSE);
        if (latestCode == null) {
            throw new BusinessException("Please request an email verification code first.");
        }
        if (latestCode.getUsedAt() != null) {
            throw new BusinessException("This verification code has already been used. Please request a new one.");
        }
        if (latestCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("This verification code has expired. Please request a new one.");
        }
        if (!latestCode.getCode().equals(request.getVerificationCode())) {
            throw new BusinessException("The verification code is incorrect.");
        }

        User existingUser = authMapper.findUserByEmail(email);
        if (existingUser != null && Boolean.TRUE.equals(existingUser.getVerified())) {
            throw new BusinessException("This email has already completed registration. Please sign in directly.");
        }

        User user = existingUser == null ? new User() : existingUser;
        User inviter = findInviter(request.getInviteCode(), email);
        user.setUsername(request.getDisplayName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone().trim());
        user.setRole("user");
        user.setVerified(true);
        user.setPoints(existingUser != null && existingUser.getPoints() != null ? existingUser.getPoints() : INITIAL_SIGNUP_POINTS);
        user.setStarterPointsGranted(true);
        user.setLastWeeklyClaimAt(existingUser != null ? existingUser.getLastWeeklyClaimAt() : null);
        user.setWeeklyCardExpiresAt(existingUser != null ? existingUser.getWeeklyCardExpiresAt() : null);
        user.setInviteCode(existingUser != null && existingUser.getInviteCode() != null
                ? existingUser.getInviteCode()
                : generateInviteCode(request.getDisplayName()));
        user.setReferredByUserId(inviter != null ? inviter.getId() : null);
        user.setRunnerApplicationStatus(existingUser != null && existingUser.getRunnerApplicationStatus() != null
                ? existingUser.getRunnerApplicationStatus()
                : "NONE");
        user.setRunnerApplicationRequestedAt(existingUser != null ? existingUser.getRunnerApplicationRequestedAt() : null);
        user.setRunnerApplicationReviewedAt(existingUser != null ? existingUser.getRunnerApplicationReviewedAt() : null);
        user.setBanned(existingUser != null && Boolean.TRUE.equals(existingUser.getBanned()));
        user.setBanReason(existingUser != null ? existingUser.getBanReason() : null);
        user.setBannedAt(existingUser != null ? existingUser.getBannedAt() : null);
        user.setCancellationCount(existingUser != null && existingUser.getCancellationCount() != null ? existingUser.getCancellationCount() : 0);
        user.setRunnerGiveUpCount(existingUser != null && existingUser.getRunnerGiveUpCount() != null ? existingUser.getRunnerGiveUpCount() : 0);
        user.setPassword(request.getPassword());

        if (existingUser == null) {
            authMapper.insertUser(user);
        } else {
            authMapper.updateUser(user);
        }
        if (inviter != null) {
            authMapper.addPoints(inviter.getId(), INVITE_REWARD_POINTS);
            User refreshedInviter = authMapper.findUserById(inviter.getId());
            recordPointChange(refreshedInviter, INVITE_REWARD_POINTS, "INVITE_REWARD", "Invite reward for a successful registration.", null);
        }
        authMapper.markCodeUsed(latestCode.getId());
        User savedUser = authMapper.findUserById(user.getId());
        recordPointChange(savedUser, INITIAL_SIGNUP_POINTS, "STARTER_POINTS", "Starter points for a new account.", null);
        String message = inviter == null
                ? "Registration successful. Your account has received 20 starter points."
                : "Registration successful. Your account has received 20 starter points, and the inviter has earned 25 points.";
        return issueAuthResponse(savedUser, message);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        ensureLeedsEmail(email);
        if (isBlank(request.getPassword())) {
            throw new BusinessException("Please enter your password.");
        }

        User user = authMapper.findUserByEmail(email);
        if (user == null) {
            throw new BusinessException("This email has not been registered.");
        }
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("This account has not finished email verification yet.");
        }
        ensureNotBanned(user);
        if (!request.getPassword().equals(user.getPassword())) {
            throw new BusinessException("The email or password is incorrect.");
        }

        boolean grantedStarterPoints = !Boolean.TRUE.equals(user.getStarterPointsGranted());
        if (grantedStarterPoints) {
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + INITIAL_SIGNUP_POINTS);
            user.setStarterPointsGranted(true);
            authMapper.updateUser(user);
            user = authMapper.findUserById(user.getId());
            recordPointChange(user, INITIAL_SIGNUP_POINTS, "STARTER_POINTS", "One-time starter points added at login.", null);
        }

        user = ensureInviteCode(user);
        return issueAuthResponse(
                user,
                grantedStarterPoints
                        ? "Login successful. Your one-time 20 starter points have been added."
                        : "Login successful. Your session is valid for 24 hours."
        );
    }

    public AuthResponse getCurrentUser(String authorizationHeader) {
        UserSession session = findActiveSession(authorizationHeader);
        User user = authMapper.findUserById(session.getUserId());
        if (user == null) {
            throw new BusinessException("Current user does not exist.");
        }
        user = refreshExpiredBan(user);
        user = ensureInviteCode(user);
        AuthResponse response = new AuthResponse();
        response.setToken(session.getToken());
        response.setExpiresAt(session.getExpiresAt().format(FORMATTER));
        response.setUser(sanitizeUser(user));
        response.setMessage(Boolean.TRUE.equals(user.getBanned())
                ? buildBanMessage(trimToNull(user.getBanReason()), resolveBanEndsAt(user))
                : "Current login session is active.");
        return response;
    }

    @Transactional
    public AuthResponse updateProfile(String authorizationHeader, UpdateProfileRequest request) {
        User user = loadCurrentUser(authorizationHeader);
        if (isBlank(request.getUsername())) {
            throw new BusinessException("Display name cannot be empty.");
        }
        if (isBlank(request.getPhone())) {
            throw new BusinessException("Phone number cannot be empty.");
        }

        user.setUsername(request.getUsername().trim());
        user.setPhone(request.getPhone().trim());
        user.setCommonAddress(trimToNull(request.getCommonAddress()));
        user.setDetailAddress(trimToNull(request.getDetailAddress()));
        authMapper.updateProfile(user);

        User refreshedUser = authMapper.findUserById(user.getId());
        UserSession session = findActiveSession(authorizationHeader);

        AuthResponse response = new AuthResponse();
        response.setToken(session.getToken());
        response.setExpiresAt(session.getExpiresAt().format(FORMATTER));
        response.setUser(sanitizeUser(refreshedUser));
        response.setMessage("Profile updated successfully.");
        return response;
    }

    public InviteRecordResponse getInviteRecords(String authorizationHeader) {
        User user = ensureInviteCode(loadCurrentUser(authorizationHeader));
        List<InviteRecordItem> records = authMapper.findInviteRecordsByUserId(user.getId())
                .stream()
                .map(record -> {
                    InviteRecordItem item = new InviteRecordItem();
                    item.setUserId(record.getUserId());
                    item.setUsername(record.getUsername());
                    item.setEmail(record.getEmail());
                    item.setRewardPoints(record.getRewardPoints());
                    item.setRegisteredAt(record.getRegisteredAt());
                    return item;
                })
                .collect(Collectors.toList());

        InviteRecordResponse response = new InviteRecordResponse();
        response.setInviteCode(user.getInviteCode());
        response.setTotalInvites(records.size());
        response.setTotalRewardPoints(records.stream().mapToInt(item -> item.getRewardPoints() == null ? 0 : item.getRewardPoints()).sum());
        response.setRecords(records);
        return response;
    }

    public List<PointTransaction> getPointHistory(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        return authMapper.findPointTransactionsByUserId(user.getId());
    }

    @Transactional
    public AuthResponse claimWeeklyPoints(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        LocalDateTime now = LocalDateTime.now();
        if (now.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new BusinessException("Weekly points can only be claimed on Monday.");
        }
        if (user.getLastWeeklyClaimAt() != null && user.getLastWeeklyClaimAt().toLocalDate().isEqual(now.toLocalDate())) {
            throw new BusinessException("You have already claimed this week's points.");
        }

        authMapper.claimWeeklyPoints(user.getId(), WEEKLY_MONDAY_POINTS);
        User refreshed = authMapper.findUserById(user.getId());
        recordPointChange(refreshed, WEEKLY_MONDAY_POINTS, "WEEKLY_REFRESH", "Weekly Monday points refresh.", null);
        return buildCurrentAuthResponse(authorizationHeader, "Weekly refresh completed. 15 points have been added to your account.");
    }

    @Transactional
    public AuthResponse activateWeeklyCard(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        if (user.getWeeklyCardExpiresAt() != null && user.getWeeklyCardExpiresAt().isAfter(LocalDateTime.now())) {
            throw new BusinessException("Your weekly card is already active.");
        }

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        int updated = authMapper.activateWeeklyCard(user.getId(), WEEKLY_CARD_COST, expiresAt);
        if (updated == 0) {
            throw new BusinessException("You do not have enough points to activate the weekly card.");
        }
        User refreshed = authMapper.findUserById(user.getId());
        recordPointChange(refreshed, -WEEKLY_CARD_COST, "WEEKLY_CARD", "Opened weekly card for 7 days.", null);
        return buildCurrentAuthResponse(authorizationHeader, "Weekly card activated. 10 points have been deducted and each order this week gets 2 points off.");
    }

    @Transactional
    public AuthResponse applyForRunner(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        if ("RUNNER".equalsIgnoreCase(user.getRole())) {
            return buildCurrentAuthResponse(authorizationHeader, "Runner access is already active.");
        }
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Admin accounts do not need runner approval.");
        }
        if ("PENDING".equalsIgnoreCase(user.getRunnerApplicationStatus())) {
            return buildCurrentAuthResponse(authorizationHeader, "Your runner application is already waiting for admin review.");
        }

        authMapper.updateRunnerApplicationStatus(user.getId(), "PENDING");
        return buildCurrentAuthResponse(authorizationHeader, "Runner application submitted. Please wait for admin approval.");
    }

    @Transactional
    public AuthResponse revokeRunner(String authorizationHeader) {
        User user = loadCurrentUser(authorizationHeader);
        if (!"RUNNER".equalsIgnoreCase(user.getRole())) {
            return buildCurrentAuthResponse(authorizationHeader, "This account is already using the customer role.");
        }
        if (orderMapper.countIncompleteRunnerOrders(user.getId()) > 0) {
            throw new BusinessException("You still have unfinished runner orders. Complete them before disabling runner access.");
        }

        authMapper.updateUserRole(user.getId(), "user");
        return buildCurrentAuthResponse(authorizationHeader, "Runner access has been disabled. Your account is now back to customer mode.");
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

    private void ensureNotBanned(User user) {
        if (user != null && Boolean.TRUE.equals(user.getBanned())) {
            user = refreshExpiredBan(user);
        }
        if (user != null && Boolean.TRUE.equals(user.getBanned())) {
            String reason = trimToNull(user.getBanReason());
            throw new BusinessException(buildBanMessage(reason, resolveBanEndsAt(user)));
        }
    }

    private User refreshExpiredBan(User user) {
        if (user == null || !Boolean.TRUE.equals(user.getBanned())) {
            return user;
        }
        LocalDateTime banEndsAt = resolveBanEndsAt(user);
        if (banEndsAt != null && !banEndsAt.isAfter(LocalDateTime.now())) {
            authMapper.unbanUser(user.getId());
            User refreshed = authMapper.findUserById(user.getId());
            return refreshed == null ? user : refreshed;
        }
        return user;
    }

    private LocalDateTime resolveBanEndsAt(User user) {
        return user.getBannedAt() == null ? null : user.getBannedAt().plusDays(BAN_DAYS);
    }

    private String buildBanMessage(String reason, LocalDateTime banEndsAt) {
        String remaining = "Please try again after the 3-day ban period.";
        if (banEndsAt != null) {
            long hours = Math.max(1, Duration.between(LocalDateTime.now(), banEndsAt).toHours() + 1);
            long days = Math.max(1, (hours + 23) / 24);
            remaining = "You can log in again in about " + days + " day" + (days == 1 ? "" : "s") + ".";
        }
        return reason == null
                ? "This account is banned for 3 days. " + remaining
                : "This account is banned for 3 days: " + reason + " " + remaining;
    }

    private UserSession findActiveSession(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        UserSession session = authMapper.findSessionByToken(token);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Login has expired. Please sign in again.");
        }
        return session;
    }

    private AuthResponse issueAuthResponse(User user, String message) {
        authMapper.deleteSessionsByUserId(user.getId());

        UserSession session = new UserSession();
        session.setUserId(user.getId());
        session.setToken(UUID.randomUUID().toString().replace("-", ""));
        session.setExpiresAt(LocalDateTime.now().plusHours(24));
        authMapper.insertSession(session);

        AuthResponse response = new AuthResponse();
        response.setToken(session.getToken());
        response.setExpiresAt(session.getExpiresAt().format(FORMATTER));
        response.setUser(sanitizeUser(user));
        response.setMessage(message);
        return response;
    }

    private AuthResponse buildCurrentAuthResponse(String authorizationHeader, String message) {
        User refreshedUser = authMapper.findUserById(loadCurrentUser(authorizationHeader).getId());
        UserSession session = findActiveSession(authorizationHeader);

        AuthResponse response = new AuthResponse();
        response.setToken(session.getToken());
        response.setExpiresAt(session.getExpiresAt().format(FORMATTER));
        response.setUser(sanitizeUser(refreshedUser));
        response.setMessage(message);
        return response;
    }

    private void validateRegisterRequest(RegisterRequest request) {
        if (isBlank(request.getDisplayName())) {
            throw new BusinessException("Please enter a display name.");
        }
        if (isBlank(request.getPhone())) {
            throw new BusinessException("Please enter a phone number.");
        }
        if (isBlank(request.getPassword()) || request.getPassword().length() < 6) {
            throw new BusinessException("Password must be at least 6 characters.");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("The two passwords do not match.");
        }
        if (isBlank(request.getVerificationCode())) {
            throw new BusinessException("Please enter the verification code.");
        }
    }

    private void ensureLeedsEmail(String email) {
        if (!email.endsWith(LEEDS_SUFFIX)) {
            throw new BusinessException("Only @leeds.ac.uk campus emails are supported.");
        }
    }

    private String normalizeEmail(String email) {
        if (isBlank(email)) {
            throw new BusinessException("Please enter an email address.");
        }
        return email.trim().toLowerCase();
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new BusinessException("A valid login token is required.");
        }
        return authorizationHeader.substring(7).trim();
    }

    private User sanitizeUser(User user) {
        user.setPassword(null);
        return user;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private User findInviter(String inviteCode, String currentEmail) {
        String normalizedInviteCode = trimToNull(inviteCode);
        if (normalizedInviteCode == null) {
            return null;
        }
        User inviter = authMapper.findUserByInviteCode(normalizedInviteCode.toUpperCase(Locale.ROOT));
        if (inviter == null) {
            throw new BusinessException("The invite code does not exist.");
        }
        if (currentEmail.equalsIgnoreCase(inviter.getEmail())) {
            throw new BusinessException("You cannot enter your own invite code.");
        }
        return inviter;
    }

    private String generateInviteCode(String displayName) {
        String prefix = (displayName == null ? "LEEDS" : displayName.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT));
        if (prefix.length() < 4) {
            prefix = (prefix + "LEEDS").substring(0, 5);
        } else if (prefix.length() > 5) {
            prefix = prefix.substring(0, 5);
        }
        return prefix + String.format("%04d", secureRandom.nextInt(10_000));
    }

    private User ensureInviteCode(User user) {
        if (user.getInviteCode() != null && !user.getInviteCode().isBlank()) {
            return user;
        }
        user.setInviteCode(generateInviteCode(user.getUsername()));
        authMapper.updateUser(user);
        return authMapper.findUserById(user.getId());
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
