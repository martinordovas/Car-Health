package com.carhealth.api.dto;

import com.carhealth.api.domain.ServiceCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class MaintenanceDtos {

    private MaintenanceDtos() {
    }

    public enum Status {
        OVERDUE,
        DUE_SOON,
        OK,
        UNKNOWN
    }

    public record RuleRequest(
            @NotBlank @Size(max = 120) String name,
            ServiceCategory category,
            @Min(1) Integer intervalKm,
            @Min(1) Integer intervalMonths,
            @Min(0) Integer baselineOdometer,
            LocalDate baselineDate) {
    }

    public record RuleDto(
            Long id,
            String name,
            ServiceCategory category,
            Integer intervalKm,
            Integer intervalMonths,
            Integer baselineOdometer,
            LocalDate baselineDate,
            LocalDate lastServiceDate,
            Integer lastServiceOdometer,
            String lastServiceTitle,
            LocalDate nextServiceDate,
            Integer nextServiceKm,
            Integer remainingKm,
            Integer remainingDays,
            Status status) {
    }
}
