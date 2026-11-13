package com.carhealth.api.service;

import com.carhealth.api.domain.FuelLog;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.FuelDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.repository.FuelLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Service
public class FuelLogService {

    private static final Locale ES = Locale.forLanguageTag("es-ES");
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final FuelLogRepository fuelLogRepository;
    private final VehicleService vehicleService;

    public FuelLogService(FuelLogRepository fuelLogRepository, VehicleService vehicleService) {
        this.fuelLogRepository = fuelLogRepository;
        this.vehicleService = vehicleService;
    }

    @Transactional(readOnly = true)
    public List<FuelDtos.FuelLogDto> list(Long vehicleId, Long userId) {
        vehicleService.requireVehicle(vehicleId, userId);
        return fuelLogRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public FuelDtos.FuelLogDto create(Long vehicleId, Long userId, FuelDtos.FuelLogRequest request) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);

        if (request.clientMutationId() != null && !request.clientMutationId().isBlank()) {
            Optional<FuelLog> existing = fuelLogRepository.findByClientMutationId(request.clientMutationId());
            if (existing.isPresent()) {
                if (!existing.get().getVehicle().getId().equals(vehicleId)) {
                    throw ApiException.notFound("Repostaje no encontrado.");
                }
                return toDto(existing.get());
            }
        }

        if (request.date().isAfter(LocalDateTime.now().plusDays(1))) {
            throw ApiException.badRequest("La fecha del repostaje no puede estar en el futuro.");
        }
        if (request.odometer() < vehicle.getCurrentOdometer()) {
            throw ApiException.badRequest("El odómetro no puede ser inferior al kilometraje actual del coche ("
                    + formatKm(vehicle.getCurrentOdometer()) + ").");
        }
        if (request.pricePerLiter() == null && request.totalCost() == null) {
            throw ApiException.badRequest("Indica el precio por litro o el importe total del repostaje.");
        }

        BigDecimal liters = request.liters().setScale(3, RoundingMode.HALF_UP);
        BigDecimal price = request.pricePerLiter();
        BigDecimal total = request.totalCost();
        if (price == null) {
            price = total.divide(liters, 3, RoundingMode.HALF_UP);
        }
        if (total == null) {
            total = price.multiply(liters).setScale(2, RoundingMode.HALF_UP);
        }
        price = price.setScale(3, RoundingMode.HALF_UP);
        total = total.setScale(2, RoundingMode.HALF_UP);

        List<FuelLog> previousLogs = fuelLogRepository.findByVehicleIdOrderByOdometerAsc(vehicleId);
        boolean fullTank = request.fullTank() == null || request.fullTank();

        FuelLog log = new FuelLog(vehicle);
        log.setDate(request.date());
        log.setOdometer(request.odometer());
        log.setLiters(liters);
        log.setPricePerLiter(price);
        log.setTotalCost(total);
        log.setStationName(trimToNull(request.stationName()));
        log.setStationLocation(trimToNull(request.stationLocation()));
        log.setFullTank(fullTank);
        log.setBoardComputerAvg(request.boardComputerAvg());
        log.setClientMutationId(trimToNull(request.clientMutationId()));

        applySavings(log, previousLogs, liters, price);
        log.setComputedConsumption(computeConsumption(previousLogs, request.odometer(), liters, fullTank));

        fuelLogRepository.save(log);
        if (request.odometer() > vehicle.getCurrentOdometer()) {
            vehicle.setCurrentOdometer(request.odometer());
        }
        return toDto(log);
    }

    private void applySavings(FuelLog log, List<FuelLog> previousLogs, BigDecimal liters, BigDecimal price) {
        String stationKey = stationKey(log.getStationLocation(), log.getStationName());
        List<FuelLog> sameStation = stationKey == null ? List.of() : previousLogs.stream()
                .filter(previous -> stationKey.equalsIgnoreCase(stationKey(previous.getStationLocation(), previous.getStationName())))
                .toList();

        BigDecimal reference = null;
        String comparisonType = null;

        if (!sameStation.isEmpty()) {
            BigDecimal totalLiters = sameStation.stream()
                    .map(FuelLog::getLiters)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalLiters.signum() > 0) {
                BigDecimal weighted = sameStation.stream()
                        .map(previous -> previous.getPricePerLiter().multiply(previous.getLiters()))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                reference = weighted.divide(totalLiters, 3, RoundingMode.HALF_UP);
                comparisonType = "STATION_AVERAGE";
            }
        }

        if (reference == null && !previousLogs.isEmpty()) {
            reference = previousLogs.stream()
                    .max(Comparator.comparing(FuelLog::getDate).thenComparing(FuelLog::getOdometer))
                    .map(FuelLog::getPricePerLiter)
                    .orElse(null);
            comparisonType = reference != null ? "PREVIOUS_FILL" : null;
        }

        if (reference == null || reference.signum() <= 0) {
            return;
        }

        BigDecimal difference = reference.subtract(price);
        BigDecimal percent = difference
                .divide(reference, 4, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(1, RoundingMode.HALF_UP);
        BigDecimal savings = difference.signum() > 0
                ? difference.multiply(liters).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        log.setReferencePrice(reference);
        log.setSavingsAmount(savings);
        log.setSavingsType(comparisonType);
    }

    private BigDecimal computeConsumption(List<FuelLog> previousLogs, Integer odometer, BigDecimal liters, boolean fullTank) {
        if (!fullTank) {
            return null;
        }
        Optional<FuelLog> previousFull = previousLogs.stream()
                .filter(FuelLog::isFullTank)
                .filter(previous -> previous.getOdometer() < odometer)
                .max(Comparator.comparing(FuelLog::getOdometer));
        if (previousFull.isEmpty()) {
            return null;
        }
        int distance = odometer - previousFull.get().getOdometer();
        if (distance <= 0) {
            return null;
        }
        BigDecimal litersSincePrevious = previousLogs.stream()
                .filter(previous -> previous.getOdometer() > previousFull.get().getOdometer())
                .map(FuelLog::getLiters)
                .reduce(liters, BigDecimal::add);

        return litersSincePrevious
                .divide(BigDecimal.valueOf(distance), 4, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public FuelDtos.FuelLogDto toDto(FuelLog log) {
        return new FuelDtos.FuelLogDto(
                log.getId(),
                log.getDate(),
                log.getOdometer(),
                log.getLiters().setScale(3, RoundingMode.HALF_UP),
                log.getPricePerLiter().setScale(3, RoundingMode.HALF_UP),
                log.getTotalCost().setScale(2, RoundingMode.HALF_UP),
                log.getStationName(),
                log.getStationLocation(),
                log.isFullTank(),
                log.getBoardComputerAvg(),
                log.getComputedConsumption(),
                savingsSummary(log),
                log.getCreatedAt());
    }

    private FuelDtos.SavingsSummary savingsSummary(FuelLog log) {
        if (log.getReferencePrice() == null) {
            return null;
        }
        BigDecimal current = log.getPricePerLiter();
        BigDecimal reference = log.getReferencePrice();
        BigDecimal difference = reference.subtract(current);
        BigDecimal percent = difference
                .divide(reference, 4, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(1, RoundingMode.HALF_UP);
        BigDecimal storedSavings = log.getSavingsAmount() != null ? log.getSavingsAmount() : BigDecimal.ZERO;
        BigDecimal amount = difference.signum() > 0 ? storedSavings : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal unitSavings = difference.signum() > 0 ? difference.setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(3);
        String station = log.getStationName() != null ? log.getStationName() : "esta gasolinera";

        String message;
        if (difference.signum() > 0) {
            message = "Has ahorrado " + money(amount) + " (" + decimalComma(percent) + " %) frente a "
                    + referenceLabel(log.getSavingsType(), station) + ".";
        } else if (difference.signum() < 0) {
            message = "Has pagado un " + decimalComma(percent.abs()) + " % más que "
                    + referenceLabel(log.getSavingsType(), station) + ".";
        } else {
            message = "Has pagado lo mismo que " + referenceLabel(log.getSavingsType(), station) + ".";
        }

        return new FuelDtos.SavingsSummary(
                reference,
                current,
                unitSavings,
                amount,
                percent,
                log.getSavingsType(),
                message);
    }

    private String referenceLabel(String type, String station) {
        if ("STATION_AVERAGE".equals(type)) {
            return "tu media en " + station;
        }
        if ("PREVIOUS_FILL".equals(type)) {
            return "tu último repostaje";
        }
        return "tu precio de referencia";
    }

    private String money(BigDecimal value) {
        return String.format(ES, "%.2f €", value);
    }

    private String decimalComma(BigDecimal value) {
        return value.toPlainString().replace('.', ',');
    }

    private String formatKm(Integer km) {
        return String.format(ES, "%,d km", km);
    }

    private String stationKey(String location, String name) {
        String value = location != null && !location.isBlank() ? location : name;
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(ES);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
