package com.carhealth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 80) String displayName) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record UserDto(Long id, String email, String displayName, Instant createdAt) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record VerifyEmailRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "El código debe tener 6 dígitos.") String code) {
    }

    public record ResendVerificationRequest(@NotBlank @Email String email) {
    }

    public record VerificationResponse(
            String email,
            int expiresInSeconds,
            int resendAfterSeconds,
            boolean verificationRequired) {
    }

    public record UpdateProfileRequest(@NotBlank @Size(max = 80) String displayName) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72) String newPassword) {
    }
}
