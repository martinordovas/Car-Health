package com.carhealth.api.service;

import com.carhealth.api.domain.User;
import com.carhealth.api.dto.AuthDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.error.EmailVerificationRequiredException;
import com.carhealth.api.repository.UserRepository;
import com.carhealth.api.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    static final Duration VERIFICATION_CODE_TTL = Duration.ofMinutes(10);
    static final Duration VERIFICATION_RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_VERIFICATION_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationEmailSender emailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            VerificationEmailSender emailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailSender = emailSender;
    }

    @Transactional
    public AuthDtos.VerificationResponse register(AuthDtos.RegisterRequest request, Locale locale) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Ya existe una cuenta con ese correo electrónico.");
        }
        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().trim());
        userRepository.save(user);
        issueVerificationCode(user, locale);
        return verificationResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> ApiException.unauthorized("Correo o contraseña incorrectos."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Correo o contraseña incorrectos.");
        }
        if (!user.isEmailVerified()) {
            throw new EmailVerificationRequiredException(
                    user.getEmail(),
                    remainingSeconds(user.getEmailVerificationExpiresAt()),
                    resendAfterSeconds(user.getEmailVerificationSentAt()));
        }
        return new AuthDtos.AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthDtos.AuthResponse verifyEmail(AuthDtos.VerifyEmailRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> invalidVerificationCode());

        if (user.isEmailVerified()) {
            throw ApiException.badRequest("El correo ya está verificado. Inicia sesión.");
        }

        Instant now = Instant.now();
        if (user.getEmailVerificationCodeHash() == null
                || user.getEmailVerificationExpiresAt() == null
                || now.isAfter(user.getEmailVerificationExpiresAt())
                || user.getEmailVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            throw invalidVerificationCode();
        }

        if (!passwordEncoder.matches(request.code().trim(), user.getEmailVerificationCodeHash())) {
            user.setEmailVerificationAttempts(user.getEmailVerificationAttempts() + 1);
            throw invalidVerificationCode();
        }

        user.setEmailVerified(true);
        clearVerificationCode(user);
        return new AuthDtos.AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional
    public AuthDtos.VerificationResponse resendVerification(String requestedEmail, Locale locale) {
        String email = normalizeEmail(requestedEmail);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        // Respuesta genérica para no revelar si la cuenta existe.
        if (user == null || user.isEmailVerified()) {
            return genericVerificationResponse(email);
        }

        Instant now = Instant.now();
        if (user.getEmailVerificationSentAt() != null
                && now.isBefore(user.getEmailVerificationSentAt().plus(VERIFICATION_RESEND_COOLDOWN))) {
            throw ApiException.tooManyRequests("Espera un momento antes de pedir otro código.");
        }

        issueVerificationCode(user, locale);
        return verificationResponse(user);
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

    private void issueVerificationCode(User user, Locale locale) {
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        Instant now = Instant.now();
        Instant expiresAt = now.plus(VERIFICATION_CODE_TTL);
        user.setEmailVerified(false);
        user.setEmailVerificationCodeHash(passwordEncoder.encode(code));
        user.setEmailVerificationExpiresAt(expiresAt);
        user.setEmailVerificationSentAt(now);
        user.setEmailVerificationAttempts(0);
        emailSender.sendVerificationCode(user.getEmail(), user.getDisplayName(), code, expiresAt, locale);
    }

    private void clearVerificationCode(User user) {
        user.setEmailVerificationCodeHash(null);
        user.setEmailVerificationExpiresAt(null);
        user.setEmailVerificationSentAt(null);
        user.setEmailVerificationAttempts(0);
    }

    private AuthDtos.VerificationResponse verificationResponse(User user) {
        return new AuthDtos.VerificationResponse(
                user.getEmail(),
                remainingSeconds(user.getEmailVerificationExpiresAt()),
                resendAfterSeconds(user.getEmailVerificationSentAt()),
                true);
    }

    private AuthDtos.VerificationResponse genericVerificationResponse(String email) {
        return new AuthDtos.VerificationResponse(
                email,
                (int) VERIFICATION_CODE_TTL.toSeconds(),
                (int) VERIFICATION_RESEND_COOLDOWN.toSeconds(),
                true);
    }

    private int remainingSeconds(Instant deadline) {
        if (deadline == null) return 0;
        return (int) Math.max(
                0,
                Math.ceil(Duration.between(Instant.now(), deadline).toMillis() / 1000.0));
    }

    private int resendAfterSeconds(Instant sentAt) {
        if (sentAt == null) return 0;
        return remainingSeconds(sentAt.plus(VERIFICATION_RESEND_COOLDOWN));
    }

    private ApiException invalidVerificationCode() {
        return ApiException.badRequest("El código no es válido o ha caducado.");
    }

    private AuthDtos.UserDto toDto(User user) {
        return new AuthDtos.UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getCreatedAt());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
