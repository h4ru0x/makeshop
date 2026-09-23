package com.OpenStore.user.user.controller;

import com.OpenStore.user.user.domain.UserService;
import com.OpenStore.user.user.dto.MeResponse;
import com.OpenStore.user.user.dto.UpdateMeRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<MeResponse> getMe(Authentication authentication) {
        return ResponseEntity.ok(userService.getMe(authentication.getName()));
    }

    @PatchMapping
    public ResponseEntity<Void> updateMe(Authentication authentication,
                                         @Valid @RequestBody UpdateMeRequest request) {
        userService.updateMe(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }
}
