package com.carhealth.api.service;

import com.carhealth.api.domain.FuelLog;
import com.carhealth.api.domain.ServiceCategory;
import com.carhealth.api.domain.ServiceRecord;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.FuelDtos;
import com.carhealth.api.dto.MaintenanceDtos;
import com.carhealth.api.dto.StatsDtos;
import com.carhealth.api.dto.VehicleDtos;
import com.carhealth.api.repository.FuelLogRepository;
import com.carhealth.api.repository.ServiceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Predicate;

@Service
public class AnalyticsService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final String[] MONTH_LABELS = {
            "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    };
    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");

    private final FuelLogRepository fuelLogRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final VehicleService vehicleService;
    private final MaintenanceService maintenanceService;

    public AnalyticsService(FuelLogRepository fuelLogRepository,
                            ServiceRecordRepository serviceRecordRepository,
                            VehicleService vehicleService,
                            MaintenanceService maintenanceService) {
        this.fuelLogRepository = fuelLogRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.vehicleService = vehicleService;
        this.maintenanceService = maintenanceService;
    }

    @Transactional(readOnly = true)
    public VehicleDtos.DashboardDto dashboard(Long vehicleId, Long userId) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);
        List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleIdOrderByOdometerAsc(vehicleId);
        List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId);
        List<MaintenanceDtos.RuleDto> upcoming = maintenanceService.upcoming(vehicle, 4);

        return new VehicleDtos.DashboardDto(
                vehicleService.toDto(vehicle),
                buildKpis(vehicle, fuelLogs, services),
                upcoming,
                recentActivity(fuelLogs, services));
    }

    @Transactional(readOnly = true)
    public StatsDtos.VehicleStatsDto vehicleStats(Long vehicleId, Long userId) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);
        List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleIdOrderByOdometerAsc(vehicleId);
        List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId);
        return buildStats(vehicle, fuelLogs, services);
    }

    @Transactional(readOnly = true)
    public FuelDtos.FuelStatsDto fuelStats(Long vehicleId, Long userId) {
        StatsDtos.VehicleStatsDto stats = vehicleStats(vehicleId, userId);
        StatsDtos.Totals totals = stats.totals();
        FuelDtos.FuelTotals fuelTotals = new FuelDtos.FuelTotals(
                totals.fuelSpent(),
                totals.totalLiters(),
                totals.avgFuelPrice(),
                totals.avgConsumption(),
                totals.lastConsumption(),
                totals.totalSavings(),
                totals.fillCount());
        return new FuelDtos.FuelStatsDto(
                fuelTotals,
                stats.monthly(),
                stats.consumption(),
                stats.prices(),
                stats.stations());
    }

    private VehicleDtos.Kpis buildKpis(Vehicle vehicle, List<FuelLog> fuelLogs, List<ServiceRecord> services) {
        BigDecimal fuelSpent = sum(fuelLogs, FuelLog::getTotalCost);
        BigDecimal serviceSpent = sumServices(services, ServiceRecord::getTotalCost);
        BigDecimal totalSpent = fuelSpent.add(serviceSpent);
        BigDecimal totalLiters = sum(fuelLogs, FuelLog::getLiters);
        BigDecimal avgFuelPrice = totalLiters.signum() > 0
                ? fuelSpent.divide(totalLiters, 3, RoundingMode.HALF_UP)
                : null;
        BigDecimal totalSavings = sumSavings(fuelLogs);
        BigDecimal avgConsumption = averageConsumption(fuelLogs, 6);
        BigDecimal lastConsumption = consumptionLogs(fuelLogs).stream().findFirst()
                .map(FuelLog::getComputedConsumption).orElse(null);

        YearMonth thisMonth = YearMonth.now();
        BigDecimal spentThisMonth = fuelLogs.stream()
                .filter(log -> YearMonth.from(log.getDate()).equals(thisMonth))
                .map(FuelLog::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(services.stream()
                        .filter(record -> YearMonth.from(record.getDate()).equals(thisMonth))
                        .map(ServiceRecord::getTotalCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        LocalDate from = LocalDate.now().minusDays(30);
        BigDecimal spentLast30Days = fuelLogs.stream()
                .filter(log -> !log.getDate().toLocalDate().isBefore(from))
                .map(FuelLog::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(services.stream()
                        .filter(record -> !record.getDate().isBefore(from))
                        .map(ServiceRecord::getTotalCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        int currentYear = LocalDate.now().getYear();
        BigDecimal savingsThisYear = fuelLogs.stream()
                .filter(log -> log.getDate().getYear() == currentYear)
                .map(FuelLog::getSavingsAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new VehicleDtos.Kpis(
                avgConsumption,
                lastConsumption,
                spentThisMonth.setScale(2, RoundingMode.HALF_UP),
                spentLast30Days.setScale(2, RoundingMode.HALF_UP),
                savingsThisYear.setScale(2, RoundingMode.HALF_UP),
                totalSpent.setScale(2, RoundingMode.HALF_UP),
                fuelSpent.setScale(2, RoundingMode.HALF_UP),
                serviceSpent.setScale(2, RoundingMode.HALF_UP),
                costPerKm(vehicle, fuelLogs, services, totalSpent),
                totalLiters.setScale(3, RoundingMode.HALF_UP),
                avgFuelPrice,
                fuelLogs.size(),
                services.size());
    }

    private StatsDtos.VehicleStatsDto buildStats(Vehicle vehicle, List<FuelLog> fuelLogs, List<ServiceRecord> services) {
        BigDecimal fuelSpent = sum(fuelLogs, FuelLog::getTotalCost);
        BigDecimal serviceSpent = sumServices(services, ServiceRecord::getTotalCost);
        BigDecimal totalSpent = fuelSpent.add(serviceSpent);
        BigDecimal liters = sum(fuelLogs, FuelLog::getLiters);
        BigDecimal avgPrice = liters.signum() > 0 ? fuelSpent.divide(liters, 3, RoundingMode.HALF_UP) : null;
        BigDecimal avgConsumption = averageConsumption(fuelLogs, 6);
        BigDecimal lastConsumption = consumptionLogs(fuelLogs).stream().findFirst()
                .map(FuelLog::getComputedConsumption).orElse(null);

        StatsDtos.Totals totals = new StatsDtos.Totals(
                fuelSpent.setScale(2, RoundingMode.HALF_UP),
                serviceSpent.setScale(2, RoundingMode.HALF_UP),
                totalSpent.setScale(2, RoundingMode.HALF_UP),
                liters.setScale(3, RoundingMode.HALF_UP),
                avgPrice,
                avgConsumption,
                lastConsumption,
                sumSavings(fuelLogs),
                costPerKm(vehicle, fuelLogs, services, totalSpent),
                fuelLogs.size(),
                services.size());

        List<StatsDtos.MonthlyPoint> monthly = buildMonthly(fuelLogs, services);
        List<StatsDtos.ConsumptionPoint> consumption = consumptionLogs(fuelLogs).stream()
                .sorted(Comparator.comparing(FuelLog::getDate))
                .map(log -> new StatsDtos.ConsumptionPoint(log.getDate(), log.getOdometer(), log.getComputedConsumption()))
                .toList();
        List<StatsDtos.PricePoint> prices = fuelLogs.stream()
                .sorted(Comparator.comparing(FuelLog::getDate))
                .map(log -> new StatsDtos.PricePoint(log.getDate(), log.getPricePerLiter()))
                .toList();
        List<StatsDtos.StationStats> stations = buildStations(fuelLogs);
        List<StatsDtos.CategoryStat> categories = buildCategories(services);

        return new StatsDtos.VehicleStatsDto(totals, monthly, consumption, prices, stations, categories);
    }

    private List<StatsDtos.MonthlyPoint> buildMonthly(List<FuelLog> fuelLogs, List<ServiceRecord> services) {
        List<StatsDtos.MonthlyPoint> result = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            List<FuelLog> monthFuel = fuelLogs.stream()
                    .filter(log -> YearMonth.from(log.getDate()).equals(month))
                    .toList();
            List<ServiceRecord> monthServices = services.stream()
                    .filter(record -> YearMonth.from(record.getDate()).equals(month))
                    .toList();

            BigDecimal fuelSpent = sum(monthFuel, FuelLog::getTotalCost);
            BigDecimal serviceSpent = sumServices(monthServices, ServiceRecord::getTotalCost);
            BigDecimal total = fuelSpent.add(serviceSpent);
            BigDecimal liters = sum(monthFuel, FuelLog::getLiters);
            BigDecimal savings = sumSavings(monthFuel);
            BigDecimal consumption = averageConsumption(monthFuel, Integer.MAX_VALUE);

            result.add(new StatsDtos.MonthlyPoint(
                    month.format(MONTH_KEY),
                    MONTH_LABELS[month.getMonthValue() - 1],
                    fuelSpent.setScale(2, RoundingMode.HALF_UP),
                    serviceSpent.setScale(2, RoundingMode.HALF_UP),
                    total.setScale(2, RoundingMode.HALF_UP),
                    liters.setScale(3, RoundingMode.HALF_UP),
                    savings,
                    consumption));
        }
        return result;
    }

    private List<StatsDtos.StationStats> buildStations(List<FuelLog> fuelLogs) {
        Map<String, List<FuelLog>> grouped = new LinkedHashMap<>();
        for (FuelLog log : fuelLogs) {
            String key = stationKey(log);
            grouped.computeIfAbsent(key, ignored -> new ArrayList<>()).add(log);
        }

        List<StatsDtos.StationStats> result = new ArrayList<>();
        for (List<FuelLog> stationLogs : grouped.values()) {
            FuelLog reference = stationLogs.stream()
                    .max(Comparator.comparing(FuelLog::getDate))
                    .orElseThrow();
            String name = stationLogs.stream()
                    .map(FuelLog::getStationName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("Sin gasolinera");
            String location = stationLogs.stream()
                    .map(FuelLog::getStationLocation)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            BigDecimal liters = sum(stationLogs, FuelLog::getLiters);
            BigDecimal spent = sum(stationLogs, FuelLog::getTotalCost);
            BigDecimal avgPrice = liters.signum() > 0
                    ? spent.divide(liters, 3, RoundingMode.HALF_UP)
                    : reference.getPricePerLiter();
            BigDecimal bestPrice = stationLogs.stream()
                    .map(FuelLog::getPricePerLiter)
                    .min(BigDecimal::compareTo)
                    .orElse(reference.getPricePerLiter());
            BigDecimal savings = sumSavings(stationLogs);

            result.add(new StatsDtos.StationStats(
                    name,
                    location,
                    stationLogs.size(),
                    avgPrice,
                    bestPrice,
                    reference.getPricePerLiter(),
                    spent.setScale(2, RoundingMode.HALF_UP),
                    savings));
        }

        result.sort(Comparator.comparing(StatsDtos.StationStats::totalSpent).reversed());
        return result;
    }

    private List<StatsDtos.CategoryStat> buildCategories(List<ServiceRecord> services) {
        Map<ServiceCategory, List<ServiceRecord>> grouped = new LinkedHashMap<>();
        for (ServiceRecord record : services) {
            grouped.computeIfAbsent(record.getCategory(), ignored -> new ArrayList<>()).add(record);
        }
        return grouped.entrySet().stream()
                .map(entry -> new StatsDtos.CategoryStat(
                        entry.getKey(),
                        sumServices(entry.getValue(), ServiceRecord::getTotalCost),
                        entry.getValue().size()))
                .sorted(Comparator.comparing(StatsDtos.CategoryStat::total).reversed())
                .toList();
    }

    private List<VehicleDtos.ActivityItem> recentActivity(List<FuelLog> fuelLogs, List<ServiceRecord> services) {
        List<VehicleDtos.ActivityItem> activity = new ArrayList<>();
        for (FuelLog log : fuelLogs) {
            String title = log.getStationName() != null ? "Repostaje en " + log.getStationName() : "Repostaje";
            String subtitle = String.format("%s L · %,d km", log.getLiters().stripTrailingZeros().toPlainString(), log.getOdometer());
            activity.add(new VehicleDtos.ActivityItem(
                    "FUEL", log.getId(), log.getDate(), title, subtitle, log.getTotalCost()));
        }
        for (ServiceRecord record : services) {
            String subtitle = categoryLabel(record.getCategory()) + " · "
                    + (record.getPerformedBy().name().equals("DIY") ? "Por tu cuenta" : "Taller");
            activity.add(new VehicleDtos.ActivityItem(
                    "SERVICE", record.getId(), record.getDate().atTime(LocalTime.NOON),
                    record.getTitle(), subtitle, record.getTotalCost()));
        }
        activity.sort(Comparator.comparing(VehicleDtos.ActivityItem::date).reversed());
        return activity.stream().limit(5).toList();
    }

    private List<FuelLog> consumptionLogs(List<FuelLog> logs) {
        return logs.stream()
                .filter(log -> log.getComputedConsumption() != null)
                .sorted(Comparator.comparing(FuelLog::getDate).reversed())
                .toList();
    }

    private BigDecimal averageConsumption(List<FuelLog> logs, int limit) {
        List<BigDecimal> values = logs.stream()
                .filter(log -> log.getComputedConsumption() != null)
                .sorted(Comparator.comparing(FuelLog::getDate).reversed())
                .limit(limit)
                .map(FuelLog::getComputedConsumption)
                .toList();
        if (values.isEmpty()) {
            return null;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal costPerKm(Vehicle vehicle, List<FuelLog> logs, List<ServiceRecord> services, BigDecimal totalSpent) {
        Integer minFuel = logs.stream().map(FuelLog::getOdometer).min(Integer::compareTo).orElse(null);
        Integer minService = services.stream().map(ServiceRecord::getOdometer).min(Integer::compareTo).orElse(null);
        Integer minOdometer = null;
        if (minFuel != null && minService != null) {
            minOdometer = Math.min(minFuel, minService);
        } else if (minFuel != null) {
            minOdometer = minFuel;
        } else if (minService != null) {
            minOdometer = minService;
        }
        if (minOdometer == null) {
            return null;
        }
        int distance = vehicle.getCurrentOdometer() - minOdometer;
        if (distance <= 0) {
            return null;
        }
        return totalSpent.divide(BigDecimal.valueOf(distance), 3, RoundingMode.HALF_UP);
    }

    private BigDecimal sum(List<FuelLog> logs, java.util.function.Function<FuelLog, BigDecimal> extractor) {
        return logs.stream().map(extractor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumServices(List<ServiceRecord> records, java.util.function.Function<ServiceRecord, BigDecimal> extractor) {
        return records.stream().map(extractor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumSavings(List<FuelLog> logs) {
        return logs.stream()
                .map(FuelLog::getSavingsAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String stationKey(FuelLog log) {
        if (log.getStationLocation() != null && !log.getStationLocation().isBlank()) {
            return log.getStationLocation().trim().toLowerCase();
        }
        if (log.getStationName() != null && !log.getStationName().isBlank()) {
            return log.getStationName().trim().toLowerCase();
        }
        return "sin-gasolinera";
    }

    private String categoryLabel(ServiceCategory category) {
        return switch (category) {
            case PREVENTIVE -> "Mantenimiento preventivo";
            case CORRECTIVE -> "Reparación";
            case MODIFICATION -> "Mejora";
            case LEGAL -> "Trámite legal";
        };
    }
}
