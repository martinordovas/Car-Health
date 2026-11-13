package com.carhealth.api.controller;

import com.carhealth.api.dto.FuelDtos;
import com.carhealth.api.security.AuthUser;
import com.carhealth.api.service.AnalyticsService;
import com.carhealth.api.service.FuelLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles/{vehicleId}/fuel-logs")
@Tag(name = "Repostajes", description = "Registro de combustible, ahorro y consumo real")
public class FuelLogController {

    private final FuelLogService fuelLogService;
    private final AnalyticsService analyticsService;

    public FuelLogController(FuelLogService fuelLogService, AnalyticsService analyticsService) {
        this.fuelLogService = fuelLogService;
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @Operation(summary = "Historial de repostajes")
    public List<FuelDtos.FuelLogDto> list(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return fuelLogService.list(vehicleId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar repostaje y calcular ahorro y consumo")
    public FuelDtos.FuelLogDto create(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId,
            @Valid @RequestBody FuelDtos.FuelLogRequest request) {
        return fuelLogService.create(vehicleId, user.id(), request);
    }

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de repostajes y gasolineras")
    public FuelDtos.FuelStatsDto stats(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return analyticsService.fuelStats(vehicleId, user.id());
    }
}
