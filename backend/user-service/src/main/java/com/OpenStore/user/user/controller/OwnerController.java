package com.OpenStore.user.user.controller;

import com.OpenStore.user.user.domain.UserService;
import com.OpenStore.user.user.dto.OwnerUserResponse;
import com.OpenStore.user.user.dto.UpdateSubscriptionRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/user")
public class OwnerController {

    private final UserService userService;

    public OwnerController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OwnerUserResponse>> listOwners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(userService.listOwners(page, size));
    }

    @PatchMapping("/{id}/subscription")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateOwnerSubscription(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubscriptionRequest request
    ) {
        userService.updateOwnerSubscriptionByAdmin(id, request.getSubscription());
        return ResponseEntity.ok(Map.of("message", "Suscripcion actualizada"));
    }

    @PatchMapping("/me/subscription")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> updateMySubscription(
            Authentication authentication,
            @Valid @RequestBody UpdateSubscriptionRequest request
    ) {
        userService.updateMyOwnerSubscription(authentication.getName(), request.getSubscription());
        return ResponseEntity.ok(Map.of("message", "Suscripcion actualizada"));
    }
}
