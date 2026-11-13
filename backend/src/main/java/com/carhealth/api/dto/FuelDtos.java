package com.carhealth.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class FuelDtos {

    private FuelDtos() {
    }

    public record FuelLogRequest(
            @NotNull LocalDateTime date,
            @NotNull @Min(1) Integer odometer,
            @NotNull @DecimalMin("0.01") BigDecimal liters,
            @DecimalMin("0.001") BigDecimal pricePerLiter,
            @DecimalMin("0.01") BigDecimal totalCost,
            @Size(max = 100) String stationName,
            @Size(max = 160) String stationLocation,
            Boolean fullTank,
            @DecimalMin("0.1") BigDecimal boardComputerAvg,
            @Size(max = 64) String clientMutationId) {
    }

    public record SavingsSummary(
            BigDecimal referencePrice,
            BigDecimal currentPrice,
            BigDecimal unitSavings,
            BigDecimal savingsAmount,
            BigDecimal percentCheaper,
            String comparisonType,
            String message) {
    }

    public record FuelLogDto(
            Long id,
            LocalDateTime date,
            Integer odometer,
            BigDecimal liters,
            BigDecimal pricePerLiter,
            BigDecimal totalCost,
            String stationName,
            String stationLocation,
            boolean fullTank,
            BigDecimal boardComputerAvg,
            BigDecimal consumption,
            SavingsSummary savings,
            Instant createdAt) {
    }

    public record FuelTotals(
            BigDecimal totalSpent,
            BigDecimal totalLiters,
            BigDecimal avgPricePerLiter,
            BigDecimal avgConsumption,
            BigDecimal lastConsumption,
            BigDecimal totalSavings,
            int fillCount) {
    }

    public record FuelStatsDto(
            FuelTotals totals,
            List<StatsDtos.MonthlyPoint> monthly,
            List<StatsDtos.ConsumptionPoint> consumption,
            List<StatsDtos.PricePoint> prices,
            List<StatsDtos.StationStats> stations) {
    }
}
