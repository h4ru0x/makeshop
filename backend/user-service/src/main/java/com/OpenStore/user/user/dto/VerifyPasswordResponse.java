package com.OpenStore.user.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyPasswordResponse {
    private String code;
    private String message;
}
