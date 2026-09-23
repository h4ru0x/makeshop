package com.OpenStore.user.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Email
    @NotBlank
    @Size(max = 150)
    private String email;

    @JsonAlias({"phone", "phoneNumber"})
    private String phone;

    @NotBlank
    @Size(min = 8, max = 100)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String password;
}
