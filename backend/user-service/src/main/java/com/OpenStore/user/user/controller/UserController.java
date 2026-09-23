package com.OpenStore.user.user.controller;

import com.OpenStore.user.user.domain.UserService;
import com.OpenStore.user.user.dto.UpdateUserRequest;
import com.OpenStore.user.user.dto.UserResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/shop/{shopId}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isShopOwner(principal.id, #shopId)")
    public ResponseEntity<?> findByShopId(
            @PathVariable UUID shopId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") String size) {
        if ("all".equalsIgnoreCase(size)) {
            return ResponseEntity.ok(userService.findAllByShopId(shopId));
        }
        try {
            int pageSize = Integer.parseInt(size);
            return ResponseEntity.ok(userService.findByShopId(shopId, page, pageSize));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Parametro size debe ser numero o all");
        }
    }

    @GetMapping("/shops")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> findByShopIds(
            @RequestParam List<UUID> shopIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(userService.findByShopIds(shopIds, page, size));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or principal.id == #id")
    public ResponseEntity<UserResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> update(@PathVariable UUID id,
                                               @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
