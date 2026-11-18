package com.carhealth.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingVerificationEmailSender implements VerificationEmailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingVerificationEmailSender.class);
    private static final DateTimeFormatter TIME = DateTimeFormatter
            .ofPattern("HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    @Override
    public void sendVerificationCode(
            String email,
            String displayName,
            String code,
            Instant expiresAt,
            Locale locale) {
        log.warn(
                "MAIL_ENABLED=false. Código de verificación para {}: {} (caduca a las {}). "
                        + "Configura SMTP para enviar correos reales.",
                email,
                code,
                TIME.format(expiresAt));
    }
}
