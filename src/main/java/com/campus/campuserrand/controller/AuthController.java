package com.campus.campuserrand.controller;

import com.campus.campuserrand.dto.AuthResponse;
import com.campus.campuserrand.dto.LoginRequest;
import com.campus.campuserrand.dto.RegisterRequest;
import com.campus.campuserrand.dto.SendCodeRequest;
import com.campus.campuserrand.dto.UpdateProfileRequest;
import com.campus.campuserrand.dto.InviteRecordResponse;
import com.campus.campuserrand.entity.PointTransaction;
import com.campus.campuserrand.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-code")
    public Map<String, Object> sendCode(@RequestBody SendCodeRequest request) {
        return authService.sendRegisterCode(request);
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse currentUser(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.getCurrentUser(authorizationHeader);
    }

    @PostMapping("/profile")
    public AuthResponse updateProfile(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody UpdateProfileRequest request
    ) {
        return authService.updateProfile(authorizationHeader, request);
    }

    @GetMapping("/invite-records")
    public InviteRecordResponse inviteRecords(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.getInviteRecords(authorizationHeader);
    }

    @GetMapping("/point-history")
    public List<PointTransaction> pointHistory(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.getPointHistory(authorizationHeader);
    }

    @PostMapping("/claim-weekly-points")
    public AuthResponse claimWeeklyPoints(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.claimWeeklyPoints(authorizationHeader);
    }

    @PostMapping("/activate-weekly-card")
    public AuthResponse activateWeeklyCard(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.activateWeeklyCard(authorizationHeader);
    }

    @PostMapping("/apply-runner")
    public AuthResponse applyRunner(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.applyForRunner(authorizationHeader);
    }

    @PostMapping("/revoke-runner")
    public AuthResponse revokeRunner(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.revokeRunner(authorizationHeader);
    }
}
