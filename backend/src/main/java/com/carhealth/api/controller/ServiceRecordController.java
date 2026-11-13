package com.carhealth.api.controller;

import com.carhealth.api.dto.ServiceDtos;
import com.carhealth.api.security.AuthUser;
import com.carhealth.api.service.ServiceRecordService;
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
@RequestMapping("/api/v1/vehicles/{vehicleId}/service-records")
@Tag(name = "Mantenimiento", description = "Intervenciones, recambios y costes")
public class ServiceRecordController {

    private final ServiceRecordService serviceRecordService;

    public ServiceRecordController(ServiceRecordService serviceRecordService) {
        this.serviceRecordService = serviceRecordService;
    }

    @GetMapping
    @Operation(summary = "Historial de intervenciones")
    public List<ServiceDtos.ServiceRecordDto> list(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return serviceRecordService.list(vehicleId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar una intervención con sus recambios")
    public ServiceDtos.ServiceRecordDto create(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId,
            @Valid @RequestBody ServiceDtos.ServiceRecordRequest request) {
        return serviceRecordService.create(vehicleId, user.id(), request);
    }
}
