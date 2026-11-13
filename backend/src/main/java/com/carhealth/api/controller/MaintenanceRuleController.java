package com.carhealth.api.controller;

import com.carhealth.api.dto.MaintenanceDtos;
import com.carhealth.api.security.AuthUser;
import com.carhealth.api.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles/{vehicleId}/maintenance-rules")
@Tag(name = "Plan de mantenimiento", description = "Reglas preventivas y próximos vencimientos")
public class MaintenanceRuleController {

    private final MaintenanceService maintenanceService;

    public MaintenanceRuleController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    @Operation(summary = "Listar el plan de mantenimiento con su estado")
    public List<MaintenanceDtos.RuleDto> list(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return maintenanceService.list(vehicleId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Añadir una regla de mantenimiento")
    public MaintenanceDtos.RuleDto create(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId,
            @Valid @RequestBody MaintenanceDtos.RuleRequest request) {
        return maintenanceService.create(vehicleId, user.id(), request);
    }

    @DeleteMapping("/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar una regla de mantenimiento")
    public void delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId,
            @PathVariable Long ruleId) {
        maintenanceService.delete(vehicleId, ruleId, user.id());
    }
}
