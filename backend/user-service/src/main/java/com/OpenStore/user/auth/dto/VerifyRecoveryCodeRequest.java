package com.OpenStore.user.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyRecoveryCodeRequest {

    @NotBlank
    private String code;
}
