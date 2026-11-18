package com.carhealth.api.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Component
public class VerificationEmailContent {

    public record Content(String subject, String html, String text) {
    }

    public Content build(String displayName, String code, Instant expiresAt, Locale locale) {
        boolean english = locale != null && "en".equalsIgnoreCase(locale.getLanguage());
        long minutes = Math.max(
                1,
                (long) Math.ceil(Duration.between(Instant.now(), expiresAt).toSeconds() / 60.0));
        String safeName = escapeHtml(displayName == null || displayName.isBlank() ? "conductor" : displayName.trim());
        String safeEnglishName = escapeHtml(displayName == null || displayName.isBlank() ? "driver" : displayName.trim());

        String subject = english
                ? "Your Car Health verification code"
                : "Tu código de verificación de Car Health";
        String preheader = english
                ? "Your verification code expires in " + minutes + " minutes."
                : "Tu código de verificación caduca en " + minutes + " minutos.";
        String eyebrow = english ? "EMAIL VERIFICATION" : "VERIFICACIÓN DE CORREO";
        String title = english ? "Confirm your email" : "Confirma tu correo";
        String greeting = english
                ? "Hi, " + safeEnglishName + "."
                : "Hola, " + safeName + ".";
        String intro = english
                ? "Use this code to verify your email and activate your Car Health garage:"
                : "Usa este código para verificar tu correo y activar tu garaje de Car Health:";
        String expiry = english
                ? "Expires in " + minutes + " minutes"
                : "Caduca en " + minutes + " minutos";
        String security = english
                ? "If you did not create this account, you can ignore this email. No one can access your account without this code."
                : "Si no has creado esta cuenta, puedes ignorar este correo. Nadie podrá acceder a tu cuenta sin este código.";
        String hint = english
                ? "Enter the code on the verification screen to continue."
                : "Introduce el código en la pantalla de verificación para continuar.";
        String footer = english
                ? "Car Health · Your garage, in order"
                : "Car Health · Tu garaje, en orden";
        String footerNote = english
                ? "This is an automated message, please do not reply."
                : "Este es un mensaje automático, no respondas a este correo.";
        String lang = english ? "en" : "es";

        String html = """
                <!doctype html>
                <html lang="{{LANG}}">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <meta name="color-scheme" content="light">
                  <title>{{SUBJECT}}</title>
                </head>
                <body style="margin:0;padding:0;background:#f2f4ef;color:#101713;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{PREHEADER}}</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f4ef;">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e7de;border-radius:24px;overflow:hidden;">
                          <tr>
                            <td style="background:#0b2a1c;padding:26px 32px;">
                              <div style="font-size:22px;font-weight:800;letter-spacing:-1px;color:#ffffff;">carhealth<span style="color:#c9f25c;">.</span></div>
                              <div style="margin-top:5px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);">{{TAGLINE}}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:34px 32px 30px;">
                              <div style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#2f8d5a;">{{EYEBROW}}</div>
                              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;letter-spacing:-1.2px;color:#101713;">{{TITLE}}</h1>
                              <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#66716b;">{{GREETING}}</p>
                              <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#66716b;">{{INTRO}}</p>

                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
                                <tr>
                                  <td align="center" style="background:#f2f4ef;border:1px solid #e2e7de;border-radius:18px;padding:24px 12px 20px;">
                                    <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:38px;font-weight:800;letter-spacing:11px;line-height:1;color:#143d2b;padding-left:11px;">{{CODE}}</div>
                                    <div style="margin-top:14px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#96a19a;">{{EXPIRY}}</div>
                                  </td>
                                </tr>
                              </table>

                              <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:#96a19a;">{{HINT}}</p>
                              <div style="height:1px;background:#e2e7de;margin:26px 0 20px;"></div>
                              <p style="margin:0;font-size:12px;line-height:1.7;color:#66716b;">{{SECURITY}}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f7f9f4;border-top:1px solid #e2e7de;padding:18px 32px;">
                              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#96a19a;">{{FOOTER}}</p>
                              <p style="margin:6px 0 0;font-size:10px;line-height:1.5;color:#96a19a;">{{FOOTER_NOTE}}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .replace("{{LANG}}", lang)
                .replace("{{SUBJECT}}", escapeHtml(subject))
                .replace("{{PREHEADER}}", escapeHtml(preheader))
                .replace("{{TAGLINE}}", english ? "YOUR GARAGE, IN ORDER" : "TU GARAJE, EN ORDEN")
                .replace("{{EYEBROW}}", eyebrow)
                .replace("{{TITLE}}", title)
                .replace("{{GREETING}}", greeting)
                .replace("{{INTRO}}", intro)
                .replace("{{CODE}}", code)
                .replace("{{EXPIRY}}", expiry)
                .replace("{{HINT}}", hint)
                .replace("{{SECURITY}}", security)
                .replace("{{FOOTER}}", footer)
                .replace("{{FOOTER_NOTE}}", footerNote);

        String text = """
                %s

                %s
                %s

                %s
                %s

                %s
                %s

                %s
                %s
                """.formatted(
                english ? "Car Health · Your garage, in order" : "Car Health · Tu garaje, en orden",
                greeting,
                intro,
                code,
                expiry,
                hint,
                security,
                footer,
                footerNote);

        return new Content(subject, html, text);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
