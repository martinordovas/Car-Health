package com.carhealth.api.dto;

import com.carhealth.api.domain.PerformedBy;
import com.carhealth.api.domain.ServiceCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ServiceDtos {

    private ServiceDtos() {
    }

    public record ServiceRecordRequest(
            @NotNull LocalDate date,
            @NotNull @Min(0) Integer odometer,
            @NotNull ServiceCategory category,
            @NotBlank @Size(max = 140) String title,
            Long ruleId,
            @DecimalMin("0") BigDecimal totalCost,
            @DecimalMin("0") BigDecimal laborCost,
            @NotNull PerformedBy performedBy,
            @Size(max = 2000) String notes,
            @Size(max = 500) String invoiceFilePath,
            List<@Valid PartRequest> parts,
            @Size(max = 64) String clientMutationId) {
    }

    public record PartRequest(
            @NotBlank @Size(max = 140) String partName,
            @Size(max = 80) String oemReference,
            @Size(max = 60) String brand,
            @NotNull @DecimalMin("0.01") BigDecimal quantity,
            @NotNull @DecimalMin("0") BigDecimal unitPrice) {
    }

    public record PartDto(
            Long id,
            String partName,
            String oemReference,
            String brand,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
    }

    public record ServiceRecordDto(
            Long id,
            LocalDate date,
            Integer odometer,
            ServiceCategory category,
            String title,
            Long ruleId,
            String ruleName,
            BigDecimal totalCost,
            BigDecimal laborCost,
            BigDecimal partsCost,
            PerformedBy performedBy,
            String notes,
            String invoiceFilePath,
            List<PartDto> parts,
            Instant createdAt) {
    }
}
