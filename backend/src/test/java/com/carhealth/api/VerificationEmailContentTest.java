package com.carhealth.api;

import com.carhealth.api.service.VerificationEmailContent;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class VerificationEmailContentTest {

    private final VerificationEmailContent content = new VerificationEmailContent();

    @Test
    void buildsASpanishBrandedEmail() {
        VerificationEmailContent.Content email = content.build(
                "Marta",
                "482913",
                Instant.now().plus(Duration.ofMinutes(10)),
                Locale.forLanguageTag("es"));

        assertThat(email.subject()).contains("verificación");
        assertThat(email.html())
                .contains("482913")
                .contains("10 minutos")
                .contains("carhealth")
                .contains("#0b2a1c")
                .contains("Confirma tu correo");
        assertThat(email.text()).contains("482913", "Caduca en 10 minutos");
    }

    @Test
    void buildsAnEnglishEmailAndEscapesTheName() {
        VerificationEmailContent.Content email = content.build(
                "Marta <Garage>",
                "482913",
                Instant.now().plus(Duration.ofMinutes(10)),
                Locale.ENGLISH);

        assertThat(email.subject()).contains("verification code");
        assertThat(email.html())
                .contains("Your verification code")
                .contains("10 minutes")
                .contains("Marta &lt;Garage&gt;");
    }
}
