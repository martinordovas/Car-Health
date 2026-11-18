package com.carhealth.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "email_verification_code_hash", length = 100)
    private String emailVerificationCodeHash;

    @Column(name = "email_verification_expires_at")
    private Instant emailVerificationExpiresAt;

    @Column(name = "email_verification_sent_at")
    private Instant emailVerificationSentAt;

    @Column(name = "email_verification_attempts", nullable = false)
    private int emailVerificationAttempts;

    protected User() {
    }

    public User(String email, String passwordHash, String displayName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getEmailVerificationCodeHash() {
        return emailVerificationCodeHash;
    }

    public void setEmailVerificationCodeHash(String emailVerificationCodeHash) {
        this.emailVerificationCodeHash = emailVerificationCodeHash;
    }

    public Instant getEmailVerificationExpiresAt() {
        return emailVerificationExpiresAt;
    }

    public void setEmailVerificationExpiresAt(Instant emailVerificationExpiresAt) {
        this.emailVerificationExpiresAt = emailVerificationExpiresAt;
    }

    public Instant getEmailVerificationSentAt() {
        return emailVerificationSentAt;
    }

    public void setEmailVerificationSentAt(Instant emailVerificationSentAt) {
        this.emailVerificationSentAt = emailVerificationSentAt;
    }

    public int getEmailVerificationAttempts() {
        return emailVerificationAttempts;
    }

    public void setEmailVerificationAttempts(int emailVerificationAttempts) {
        this.emailVerificationAttempts = emailVerificationAttempts;
    }
}
