package com.OpenStore.user.user.controller;

import com.OpenStore.user.user.domain.UserService;
import com.OpenStore.user.user.dto.VerifyPasswordRequest;
import com.OpenStore.user.user.dto.VerifyPasswordResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VerifyController {

    private final UserService userService;

    public VerifyController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyPasswordResponse> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request) {
        String code = userService.verifyPassword(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(new VerifyPasswordResponse(code, "Password verified successfully"));
    }
}