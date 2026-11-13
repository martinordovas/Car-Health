package com.carhealth.api.dto;

import com.carhealth.api.domain.FuelType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class VehicleDtos {

    private VehicleDtos() {
    }

    public record VehicleRequest(
            @NotBlank @Size(max = 60) String brand,
            @NotBlank @Size(max = 80) String model,
            @NotNull @Min(1950) @Max(2100) Integer year,
            @Size(max = 60) String nickname,
            @Size(max = 40) String engineCode,
            @Size(max = 40) String vin,
            @Size(max = 20) String licensePlate,
            @NotNull @Min(0) Integer currentOdometer,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            FuelType fuelType,
            @Size(max = 32) String color,
            @Size(max = 1_000_000) String photoData) {
    }

    public record VehicleDto(
            Long id,
            String name,
            String nickname,
            String brand,
            String model,
            Integer year,
            String engineCode,
            String vin,
            String licensePlate,
            Integer currentOdometer,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            FuelType fuelType,
            String color,
            String photoData,
            Instant createdAt) {
    }

    public record Kpis(
            BigDecimal avgConsumption,
            BigDecimal lastConsumption,
            BigDecimal spentThisMonth,
            BigDecimal spentLast30Days,
            BigDecimal savingsThisYear,
            BigDecimal totalSpent,
            BigDecimal totalFuelSpent,
            BigDecimal totalServiceSpent,
            BigDecimal costPerKm,
            BigDecimal totalLiters,
            BigDecimal avgFuelPrice,
            long totalFuelLogs,
            long totalServiceRecords) {
    }

    public record ActivityItem(
            String type,
            Long id,
            LocalDateTime date,
            String title,
            String subtitle,
            BigDecimal amount) {
    }

    public record DashboardDto(
            VehicleDto vehicle,
            Kpis kpis,
            List<MaintenanceDtos.RuleDto> upcomingMaintenance,
            List<ActivityItem> recentActivity) {
    }
}
