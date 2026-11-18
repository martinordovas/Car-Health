package com.carhealth.api.controller;

import com.carhealth.api.dto.AuthDtos;
import com.carhealth.api.security.AuthUser;
import com.carhealth.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Registro, login y perfil del usuario")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear una cuenta y enviar el código de verificación por correo")
    public AuthDtos.VerificationResponse register(
            @Valid @RequestBody AuthDtos.RegisterRequest request,
            Locale locale) {
        return authService.register(request, locale);
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verificar el correo con el código recibido")
    public AuthDtos.AuthResponse verifyEmail(@Valid @RequestBody AuthDtos.VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Volver a enviar el código de verificación")
    public AuthDtos.VerificationResponse resendVerification(
            @Valid @RequestBody AuthDtos.ResendVerificationRequest request,
            Locale locale) {
        return authService.resendVerification(request.email(), locale);
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión y obtener un JWT")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Perfil del usuario autenticado")
    public AuthDtos.UserDto me(@AuthenticationPrincipal AuthUser user) {
        return authService.me(user.id());
    }

    @PatchMapping("/me")
    @Operation(summary = "Actualizar el nombre visible")
    public AuthDtos.UserDto updateProfile(
            @AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody AuthDtos.UpdateProfileRequest request) {
        return authService.updateProfile(user.id(), request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cambiar la contraseña")
    public void changePassword(
            @AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        authService.changePassword(user.id(), request);
    }
}
