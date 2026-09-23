package com.OpenStore.user.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateMeRequest {

    private String name;

    private String email;

    private String phoneNumber;

    @Size(min = 8, max = 100)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String password;

    @JsonAlias({"code", "codigo"})
    private String code;
}
