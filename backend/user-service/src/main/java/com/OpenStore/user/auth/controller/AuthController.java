package com.OpenStore.user.auth.controller;

import com.OpenStore.user.auth.domain.AuthService;
import com.OpenStore.user.auth.dto.AuthResponse;
import com.OpenStore.user.auth.dto.LoginRequest;
import com.OpenStore.user.auth.dto.RegisterRequest;
import com.OpenStore.user.auth.dto.ShopRegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/{shopId}/register")
    public ResponseEntity<AuthResponse> registerShopUser(@PathVariable UUID shopId,
                                                         @Valid @RequestBody ShopRegisterRequest request) {
        return ResponseEntity.ok(authService.registerShopUser(shopId, request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/{shopId}/login")
    public ResponseEntity<AuthResponse> loginShopUser(@PathVariable UUID shopId,
                                                      @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginShopUser(shopId, request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        authService.logout(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
