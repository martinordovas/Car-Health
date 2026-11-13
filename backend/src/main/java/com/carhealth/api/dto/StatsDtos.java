package com.carhealth.api.dto;

import com.carhealth.api.domain.ServiceCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class StatsDtos {

    private StatsDtos() {
    }

    public record Totals(
            BigDecimal fuelSpent,
            BigDecimal serviceSpent,
            BigDecimal totalSpent,
            BigDecimal totalLiters,
            BigDecimal avgFuelPrice,
            BigDecimal avgConsumption,
            BigDecimal lastConsumption,
            BigDecimal totalSavings,
            BigDecimal costPerKm,
            int fillCount,
            int serviceCount) {
    }

    public record MonthlyPoint(
            String month,
            String label,
            BigDecimal fuelSpent,
            BigDecimal serviceSpent,
            BigDecimal totalSpent,
            BigDecimal liters,
            BigDecimal savings,
            BigDecimal consumption) {
    }

    public record ConsumptionPoint(
            LocalDateTime date,
            Integer odometer,
            BigDecimal value) {
    }

    public record PricePoint(
            LocalDateTime date,
            BigDecimal value) {
    }

    public record StationStats(
            String name,
            String location,
            int fills,
            BigDecimal avgPrice,
            BigDecimal bestPrice,
            BigDecimal lastPrice,
            BigDecimal totalSpent,
            BigDecimal totalSavings) {
    }

    public record CategoryStat(
            ServiceCategory category,
            BigDecimal total,
            int count) {
    }

    public record VehicleStatsDto(
            Totals totals,
            List<MonthlyPoint> monthly,
            List<ConsumptionPoint> consumption,
            List<PricePoint> prices,
            List<StationStats> stations,
            List<CategoryStat> categories) {
    }
}
