package com.carhealth.api.controller;

import com.carhealth.api.dto.StatsDtos;
import com.carhealth.api.dto.VehicleDtos;
import com.carhealth.api.security.AuthUser;
import com.carhealth.api.service.AnalyticsService;
import com.carhealth.api.service.DossierService;
import com.carhealth.api.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@Tag(name = "Vehículos", description = "Garaje, dashboard y estadísticas")
public class VehicleController {

    private final VehicleService vehicleService;
    private final AnalyticsService analyticsService;
    private final DossierService dossierService;

    public VehicleController(VehicleService vehicleService,
                             AnalyticsService analyticsService,
                             DossierService dossierService) {
        this.vehicleService = vehicleService;
        this.analyticsService = analyticsService;
        this.dossierService = dossierService;
    }

    @GetMapping
    @Operation(summary = "Listar los vehículos del usuario")
    public List<VehicleDtos.VehicleDto> list(@AuthenticationPrincipal AuthUser user) {
        return vehicleService.list(user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Añadir un vehículo al garaje")
    public VehicleDtos.VehicleDto create(
            @AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody VehicleDtos.VehicleRequest request) {
        return vehicleService.create(user.id(), request);
    }

    @GetMapping("/{vehicleId}")
    @Operation(summary = "Detalle de un vehículo")
    public VehicleDtos.VehicleDto get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return vehicleService.get(vehicleId, user.id());
    }

    @PutMapping("/{vehicleId}")
    @Operation(summary = "Actualizar los datos de un vehículo")
    public VehicleDtos.VehicleDto update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId,
            @Valid @RequestBody VehicleDtos.VehicleRequest request) {
        return vehicleService.update(vehicleId, user.id(), request);
    }

    @DeleteMapping("/{vehicleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un vehículo")
    public void delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        vehicleService.delete(vehicleId, user.id());
    }

    @GetMapping("/{vehicleId}/dashboard")
    @Operation(summary = "KPIs, próximos mantenimientos y actividad reciente")
    public VehicleDtos.DashboardDto dashboard(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return analyticsService.dashboard(vehicleId, user.id());
    }

    @GetMapping("/{vehicleId}/stats")
    @Operation(summary = "Estadísticas agregadas de combustible y mantenimiento")
    public StatsDtos.VehicleStatsDto stats(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        return analyticsService.vehicleStats(vehicleId, user.id());
    }

    @GetMapping(value = "/{vehicleId}/dossier.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Libro de mantenimiento en PDF")
    public ResponseEntity<byte[]> dossier(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long vehicleId) {
        VehicleDtos.VehicleDto vehicle = vehicleService.get(vehicleId, user.id());
        byte[] pdf = dossierService.generate(vehicleId, user.id());
        String plate = vehicle.licensePlate() != null ? vehicle.licensePlate().replaceAll("[^a-zA-Z0-9]", "") : "vehiculo";
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("carhealth-dossier-" + plate + ".pdf", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
