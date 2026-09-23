package com.OpenStore.user.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class ForgotPasswordRequest {

    @Email
    @NotBlank
    private String email;
}
