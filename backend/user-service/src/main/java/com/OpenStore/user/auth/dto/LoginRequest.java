package com.OpenStore.user.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class LoginRequest {
    @JsonAlias({"identifier", "email"})
    private String identifier;

    private String password;
}
