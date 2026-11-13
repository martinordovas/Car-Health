package com.carhealth.api.service;

import com.carhealth.api.domain.MaintenanceRule;
import com.carhealth.api.domain.ServiceCategory;
import com.carhealth.api.domain.ServiceRecord;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.MaintenanceDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.repository.MaintenanceRuleRepository;
import com.carhealth.api.repository.ServiceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRuleRepository ruleRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final VehicleService vehicleService;

    public MaintenanceService(MaintenanceRuleRepository ruleRepository,
                              ServiceRecordRepository serviceRecordRepository,
                              VehicleService vehicleService) {
        this.ruleRepository = ruleRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.vehicleService = vehicleService;
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDtos.RuleDto> list(Long vehicleId, Long userId) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);
        return ruleRepository.findByVehicleIdOrderByIdAsc(vehicleId).stream()
                .map(rule -> toDto(rule, vehicle, lastService(rule.getId())))
                .sorted(Comparator
                        .comparingInt((MaintenanceDtos.RuleDto dto) -> statusRank(dto.status()))
                        .thenComparing(dto -> dto.remainingKm() == null ? Integer.MAX_VALUE : dto.remainingKm())
                        .thenComparing(dto -> dto.remainingDays() == null ? Integer.MAX_VALUE : dto.remainingDays()))
                .toList();
    }

    @Transactional
    public MaintenanceDtos.RuleDto create(Long vehicleId, Long userId, MaintenanceDtos.RuleRequest request) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);
        MaintenanceRule rule = new MaintenanceRule(vehicle, request.name().trim());
        rule.setCategory(request.category() != null ? request.category() : ServiceCategory.PREVENTIVE);
        rule.setIntervalKm(request.intervalKm());
        rule.setIntervalMonths(request.intervalMonths());
        rule.setBaselineOdometer(request.baselineOdometer() != null
                ? request.baselineOdometer() : vehicle.getCurrentOdometer());
        rule.setBaselineDate(request.baselineDate() != null ? request.baselineDate() : LocalDate.now());
        ruleRepository.save(rule);
        return toDto(rule, vehicle, null);
    }

    @Transactional
    public void delete(Long vehicleId, Long ruleId, Long userId) {
        vehicleService.requireVehicle(vehicleId, userId);
        MaintenanceRule rule = ruleRepository.findById(ruleId)
                .filter(candidate -> candidate.getVehicle().getId().equals(vehicleId))
                .orElseThrow(() -> ApiException.notFound("Regla de mantenimiento no encontrada."));
        ruleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDtos.RuleDto> upcoming(Vehicle vehicle, int limit) {
        return ruleRepository.findByVehicleIdOrderByIdAsc(vehicle.getId()).stream()
                .map(rule -> toDto(rule, vehicle, lastService(rule.getId())))
                .sorted(Comparator
                        .comparingInt((MaintenanceDtos.RuleDto dto) -> statusRank(dto.status()))
                        .thenComparing(dto -> dto.remainingKm() == null ? Integer.MAX_VALUE : dto.remainingKm())
                        .thenComparing(dto -> dto.remainingDays() == null ? Integer.MAX_VALUE : dto.remainingDays()))
                .limit(limit)
                .toList();
    }

    private ServiceRecord lastService(Long ruleId) {
        return serviceRecordRepository.findFirstByRuleIdOrderByDateDescOdometerDesc(ruleId).orElse(null);
    }

    private MaintenanceDtos.RuleDto toDto(MaintenanceRule rule, Vehicle vehicle, ServiceRecord last) {
        Integer baseKm = last != null ? last.getOdometer() : rule.getBaselineOdometer();
        LocalDate baseDate = last != null ? last.getDate() : rule.getBaselineDate();

        Integer nextKm = rule.getIntervalKm() != null && baseKm != null
                ? baseKm + rule.getIntervalKm() : null;
        LocalDate nextDate = rule.getIntervalMonths() != null && baseDate != null
                ? baseDate.plusMonths(rule.getIntervalMonths()) : null;

        Integer remainingKm = nextKm != null ? nextKm - vehicle.getCurrentOdometer() : null;
        Integer remainingDays = nextDate != null
                ? Math.toIntExact(ChronoUnit.DAYS.between(LocalDate.now(), nextDate))
                : null;

        MaintenanceDtos.Status status = computeStatus(remainingKm, remainingDays, nextKm, nextDate);

        return new MaintenanceDtos.RuleDto(
                rule.getId(),
                rule.getName(),
                rule.getCategory(),
                rule.getIntervalKm(),
                rule.getIntervalMonths(),
                rule.getBaselineOdometer(),
                rule.getBaselineDate(),
                last != null ? last.getDate() : null,
                last != null ? last.getOdometer() : null,
                last != null ? last.getTitle() : null,
                nextDate,
                nextKm,
                remainingKm,
                remainingDays,
                status);
    }

    private MaintenanceDtos.Status computeStatus(Integer remainingKm, Integer remainingDays, Integer nextKm, LocalDate nextDate) {
        if (nextKm == null && nextDate == null) {
            return MaintenanceDtos.Status.UNKNOWN;
        }
        boolean overdue = (remainingKm != null && remainingKm <= 0) || (remainingDays != null && remainingDays <= 0);
        if (overdue) {
            return MaintenanceDtos.Status.OVERDUE;
        }
        boolean soon = (remainingKm != null && remainingKm <= 1_000) || (remainingDays != null && remainingDays <= 30);
        return soon ? MaintenanceDtos.Status.DUE_SOON : MaintenanceDtos.Status.OK;
    }

    private int statusRank(MaintenanceDtos.Status status) {
        return switch (status) {
            case OVERDUE -> 0;
            case DUE_SOON -> 1;
            case OK -> 2;
            case UNKNOWN -> 3;
        };
    }
}
