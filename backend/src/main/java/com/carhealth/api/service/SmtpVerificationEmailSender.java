package com.carhealth.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class SmtpVerificationEmailSender implements VerificationEmailSender {

    private final JavaMailSender mailSender;
    private final VerificationEmailContent content;
    private final String from;
    private final String fromName;

    public SmtpVerificationEmailSender(
            JavaMailSender mailSender,
            VerificationEmailContent content,
            @Value("${app.mail.from:no-reply@carhealth.local}") String from,
            @Value("${app.mail.from-name:Car Health}") String fromName) {
        this.mailSender = mailSender;
        this.content = content;
        this.from = from;
        this.fromName = fromName;
    }

    @Override
    public void sendVerificationCode(
            String email,
            String displayName,
            String code,
            Instant expiresAt,
            Locale locale) {
        VerificationEmailContent.Content message = content.build(displayName, code, expiresAt, locale);
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(email);
            helper.setSubject(message.subject());
            helper.setText(message.text(), message.html());
            mailSender.send(mimeMessage);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new IllegalStateException("No se pudo enviar el correo de verificación.", ex);
        }
    }
}
