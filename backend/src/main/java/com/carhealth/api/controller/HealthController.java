package com.carhealth.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Salud", description = "Comprobación pública de disponibilidad de la API")
public class HealthController {

    @GetMapping
    @Operation(summary = "Comprobar si la API está disponible")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
