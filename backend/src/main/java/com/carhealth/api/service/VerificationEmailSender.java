package com.carhealth.api.service;

import java.time.Instant;
import java.util.Locale;

public interface VerificationEmailSender {

    void sendVerificationCode(
            String email,
            String displayName,
            String code,
            Instant expiresAt,
            Locale locale);
}
