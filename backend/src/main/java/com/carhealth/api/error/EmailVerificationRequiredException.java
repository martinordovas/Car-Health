package com.carhealth.api.error;

public class EmailVerificationRequiredException extends RuntimeException {

    private final String email;
    private final long expiresInSeconds;
    private final long resendAfterSeconds;

    public EmailVerificationRequiredException(String email, long expiresInSeconds, long resendAfterSeconds) {
        super("Debes verificar tu correo electrónico antes de entrar.");
        this.email = email;
        this.expiresInSeconds = expiresInSeconds;
        this.resendAfterSeconds = resendAfterSeconds;
    }

    public String getEmail() {
        return email;
    }

    public long getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public long getResendAfterSeconds() {
        return resendAfterSeconds;
    }
}
