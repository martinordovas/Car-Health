package com.carhealth.api.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailVerificationRequiredException.class)
    public ResponseEntity<ProblemDetail> handleVerificationRequired(EmailVerificationRequiredException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        detail.setTitle("Verificación pendiente");
        detail.setProperty("verificationRequired", true);
        detail.setProperty("email", ex.getEmail());
        detail.setProperty("expiresInSeconds", ex.getExpiresInSeconds());
        detail.setProperty("resendAfterSeconds", ex.getResendAfterSeconds());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(detail);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApiException(ApiException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        detail.setTitle(titleFor(ex.getStatus()));
        return ResponseEntity.status(ex.getStatus()).body(detail);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Revisa los campos marcados e inténtalo de nuevo.");
        detail.setTitle("Datos no válidos");
        detail.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadable(HttpMessageNotReadableException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El formato de algún dato no es correcto.");
        detail.setTitle("Datos no válidos");
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "El registro entra en conflicto con datos existentes.");
        detail.setTitle("Conflicto de datos");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(detail);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
                "No tienes permisos para realizar esta acción.");
        detail.setTitle("Acceso denegado");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(detail);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ha ocurrido un error inesperado. Inténtalo de nuevo.");
        detail.setTitle("Error interno");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(detail);
    }

    private String titleFor(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Solicitud incorrecta";
            case UNAUTHORIZED -> "No autorizado";
            case FORBIDDEN -> "Acceso denegado";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto";
            case TOO_MANY_REQUESTS -> "Demasiadas solicitudes";
            default -> "Error";
        };
    }
}
