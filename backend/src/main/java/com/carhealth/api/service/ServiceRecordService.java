package com.carhealth.api.service;

import com.carhealth.api.domain.MaintenanceRule;
import com.carhealth.api.domain.PartItem;
import com.carhealth.api.domain.ServiceRecord;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.ServiceDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.repository.MaintenanceRuleRepository;
import com.carhealth.api.repository.ServiceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class ServiceRecordService {

    private final ServiceRecordRepository serviceRecordRepository;
    private final MaintenanceRuleRepository ruleRepository;
    private final VehicleService vehicleService;

    public ServiceRecordService(ServiceRecordRepository serviceRecordRepository,
                                MaintenanceRuleRepository ruleRepository,
                                VehicleService vehicleService) {
        this.serviceRecordRepository = serviceRecordRepository;
        this.ruleRepository = ruleRepository;
        this.vehicleService = vehicleService;
    }

    @Transactional(readOnly = true)
    public List<ServiceDtos.ServiceRecordDto> list(Long vehicleId, Long userId) {
        vehicleService.requireVehicle(vehicleId, userId);
        return serviceRecordRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ServiceDtos.ServiceRecordDto create(Long vehicleId, Long userId, ServiceDtos.ServiceRecordRequest request) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);

        if (request.clientMutationId() != null && !request.clientMutationId().isBlank()) {
            var existing = serviceRecordRepository.findByClientMutationId(request.clientMutationId());
            if (existing.isPresent()) {
                if (!existing.get().getVehicle().getId().equals(vehicleId)) {
                    throw ApiException.notFound("Intervención no encontrada.");
                }
                return toDto(existing.get());
            }
        }

        if (request.date().isAfter(LocalDate.now().plusDays(1))) {
            throw ApiException.badRequest("La fecha de la intervención no puede estar en el futuro.");
        }

        MaintenanceRule rule = null;
        if (request.ruleId() != null) {
            rule = ruleRepository.findById(request.ruleId())
                    .filter(candidate -> candidate.getVehicle().getId().equals(vehicleId))
                    .orElseThrow(() -> ApiException.badRequest("La regla de mantenimiento no pertenece a este vehículo."));
        }

        ServiceRecord record = new ServiceRecord(vehicle);
        record.setDate(request.date());
        record.setOdometer(request.odometer());
        record.setCategory(request.category());
        record.setTitle(request.title().trim());
        record.setRule(rule);
        record.setPerformedBy(request.performedBy());
        record.setNotes(trimToNull(request.notes()));
        record.setInvoiceFilePath(trimToNull(request.invoiceFilePath()));
        record.setClientMutationId(trimToNull(request.clientMutationId()));

        BigDecimal labor = request.laborCost() != null ? request.laborCost().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
        record.setLaborCost(labor);

        List<ServiceDtos.PartRequest> parts = request.parts() != null ? request.parts() : List.of();
        for (ServiceDtos.PartRequest partRequest : parts) {
            PartItem part = new PartItem(partRequest.partName().trim());
            part.setOemReference(trimToNull(partRequest.oemReference()));
            part.setBrand(trimToNull(partRequest.brand()));
            part.setQuantity(partRequest.quantity());
            part.setUnitPrice(partRequest.unitPrice().setScale(2, RoundingMode.HALF_UP));
            record.addPart(part);
        }

        BigDecimal partsCost = partsCost(record.getParts());
        BigDecimal total = request.totalCost() != null
                ? request.totalCost().setScale(2, RoundingMode.HALF_UP)
                : labor.add(partsCost).setScale(2, RoundingMode.HALF_UP);
        record.setTotalCost(total);

        serviceRecordRepository.save(record);
        if (request.odometer() > vehicle.getCurrentOdometer()) {
            vehicle.setCurrentOdometer(request.odometer());
        }
        return toDto(record);
    }

    public ServiceDtos.ServiceRecordDto toDto(ServiceRecord record) {
        List<ServiceDtos.PartDto> parts = record.getParts().stream()
                .map(part -> new ServiceDtos.PartDto(
                        part.getId(),
                        part.getPartName(),
                        part.getOemReference(),
                        part.getBrand(),
                        part.getQuantity(),
                        part.getUnitPrice(),
                        part.lineTotal().setScale(2, RoundingMode.HALF_UP)))
                .toList();
        BigDecimal partsCost = partsCost(record.getParts());
        return new ServiceDtos.ServiceRecordDto(
                record.getId(),
                record.getDate(),
                record.getOdometer(),
                record.getCategory(),
                record.getTitle(),
                record.getRule() != null ? record.getRule().getId() : null,
                record.getRule() != null ? record.getRule().getName() : null,
                record.getTotalCost().setScale(2, RoundingMode.HALF_UP),
                record.getLaborCost().setScale(2, RoundingMode.HALF_UP),
                partsCost,
                record.getPerformedBy(),
                record.getNotes(),
                record.getInvoiceFilePath(),
                parts,
                record.getCreatedAt());
    }

    private BigDecimal partsCost(List<PartItem> parts) {
        return parts.stream()
                .map(PartItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
