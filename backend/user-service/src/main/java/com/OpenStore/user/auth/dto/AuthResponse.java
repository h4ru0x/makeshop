package com.OpenStore.user.auth.dto;

import com.OpenStore.user.user.domain.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private UUID id;
    private String name;
    private String email;
    private UserRole role;
}
