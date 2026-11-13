package com.carhealth.api.service;

import com.carhealth.api.domain.User;
import com.carhealth.api.dto.AuthDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.repository.UserRepository;
import com.carhealth.api.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Ya existe una cuenta con ese correo electrónico.");
        }
        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().trim());
        userRepository.save(user);
        return new AuthDtos.AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> ApiException.unauthorized("Correo o contraseña incorrectos."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Correo o contraseña incorrectos.");
        }
        return new AuthDtos.AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserDto me(Long userId) {
        return toDto(requireUser(userId));
    }

    @Transactional
    public AuthDtos.UserDto updateProfile(Long userId, AuthDtos.UpdateProfileRequest request) {
        User user = requireUser(userId);
        user.setDisplayName(request.displayName().trim());
        return toDto(user);
    }

    @Transactional
    public void changePassword(Long userId, AuthDtos.ChangePasswordRequest request) {
        User user = requireUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("La contraseña actual no es correcta.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    public User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("La sesión ya no es válida."));
    }

    private AuthDtos.UserDto toDto(User user) {
        return new AuthDtos.UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getCreatedAt());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
