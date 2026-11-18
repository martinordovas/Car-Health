package com.carhealth.api.config;

import com.carhealth.api.domain.FuelType;
import com.carhealth.api.domain.MaintenanceRule;
import com.carhealth.api.domain.PerformedBy;
import com.carhealth.api.domain.ServiceCategory;
import com.carhealth.api.domain.User;
import com.carhealth.api.dto.FuelDtos;
import com.carhealth.api.dto.ServiceDtos;
import com.carhealth.api.dto.VehicleDtos;
import com.carhealth.api.repository.MaintenanceRuleRepository;
import com.carhealth.api.repository.UserRepository;
import com.carhealth.api.service.FuelLogService;
import com.carhealth.api.service.ServiceRecordService;
import com.carhealth.api.service.VehicleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "app.demo-data", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_EMAIL = "demo@carhealth.app";

    private final UserRepository userRepository;
    private final MaintenanceRuleRepository ruleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VehicleService vehicleService;
    private final FuelLogService fuelLogService;
    private final ServiceRecordService serviceRecordService;

    public DemoDataSeeder(UserRepository userRepository,
                          MaintenanceRuleRepository ruleRepository,
                          PasswordEncoder passwordEncoder,
                          VehicleService vehicleService,
                          FuelLogService fuelLogService,
                          ServiceRecordService serviceRecordService) {
        this.userRepository = userRepository;
        this.ruleRepository = ruleRepository;
        this.passwordEncoder = passwordEncoder;
        this.vehicleService = vehicleService;
        this.fuelLogService = fuelLogService;
        this.serviceRecordService = serviceRecordService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmailIgnoreCase(DEMO_EMAIL)) {
            return;
        }

        User demo = new User(DEMO_EMAIL, passwordEncoder.encode("demo1234"), "Marta");
        demo.setEmailVerified(true);
        demo = userRepository.save(demo);
        VehicleDtos.VehicleDto vehicle = vehicleService.create(demo.getId(), new VehicleDtos.VehicleRequest(
                "Seat", "León", 2021, "El León", "DPBA", "VSSZZZKLZMR012345", "1234 KLM",
                31_800, LocalDate.now().minusYears(3), new BigDecimal("21900.00"),
                FuelType.GASOLINE_95, "Verde oliva", null));

        seedFuelLogs(demo.getId(), vehicle.id());
        seedServices(demo.getId(), vehicle.id());
        log.info("Datos de demostración creados. Accede con {} / demo1234", DEMO_EMAIL);
    }

    private void seedFuelLogs(Long userId, Long vehicleId) {
        int[] odometers = {32_110, 33_120, 34_150, 35_180, 36_220, 37_260, 38_300, 39_350,
                40_390, 40_905, 41_430, 42_470, 43_510, 44_550, 45_600, 46_640, 47_680, 48_320};
        String[] liters = {"61.200", "62.400", "60.800", "63.100", "61.600", "62.200", "60.400",
                "63.500", "61.800", "26.000", "38.500", "63.000", "60.600", "62.100", "61.400",
                "63.200", "62.700", "39.900"};
        String[] prices = {"1.629", "1.615", "1.599", "1.589", "1.579", "1.549", "1.559", "1.569",
                "1.529", "1.525", "1.519", "1.549", "1.539", "1.545", "1.529", "1.525", "1.519", "1.515"};
        String[] stations = {"Repsol|Repsol · A-4 km 12", "Cepsa|Cepsa · Getafe centro", "Plenoil|Plenoil · Getafe",
                "Repsol|Repsol · A-4 km 12", "Cepsa|Cepsa · Getafe centro", "Ballenoil|Ballenoil · Leganés",
                "Plenoil|Plenoil · Getafe", "Repsol|Repsol · A-4 km 12", "Ballenoil|Ballenoil · Leganés",
                "Ballenoil|Ballenoil · Leganés", "Ballenoil|Ballenoil · Leganés", "Cepsa|Cepsa · Getafe centro",
                "Plenoil|Plenoil · Getafe", "Repsol|Repsol · A-4 km 12", "Carrefour|Carrefour · Leganés",
                "Ballenoil|Ballenoil · Leganés", "Carrefour|Carrefour · Leganés", "Ballenoil|Ballenoil · Leganés"};
        boolean[] full = {true, true, true, true, true, true, true, true, true, false, true, true, true,
                true, true, true, true, true};

        DemoClock clock = new DemoClock(LocalDateTime.now().minusDays(360));
        for (int i = 0; i < odometers.length; i++) {
            String[] station = stations[i].split("\\|", 2);
            BigDecimal litersValue = new BigDecimal(liters[i]);
            BigDecimal price = new BigDecimal(prices[i]);
            FuelDtos.FuelLogRequest request = new FuelDtos.FuelLogRequest(
                    clock.next(i * 21),
                    odometers[i],
                    litersValue,
                    price,
                    price.multiply(litersValue).setScale(2, java.math.RoundingMode.HALF_UP),
                    station[0],
                    station[1],
                    full[i],
                    new BigDecimal(i < 10 ? "6.20" : "6.10"),
                    null);
            fuelLogService.create(vehicleId, userId, request);
        }
    }

    private void seedServices(Long userId, Long vehicleId) {
        Map<String, Long> rules = ruleRepository.findByVehicleIdOrderByIdAsc(vehicleId).stream()
                .collect(Collectors.toMap(MaintenanceRule::getName, MaintenanceRule::getId));

        serviceRecordService.create(vehicleId, userId, new ServiceDtos.ServiceRecordRequest(
                LocalDate.now().minusMonths(10), 33_500, ServiceCategory.PREVENTIVE,
                "Cambio de aceite y filtro", rules.get("Aceite y filtro"),
                new BigDecimal("149.00"), new BigDecimal("45.00"), PerformedBy.WORKSHOP,
                "Aceite 5W30 long life y filtro original. Revisión de niveles incluida.",
                null,
                List.of(
                        new ServiceDtos.PartRequest("Aceite motor 5W30", "G052195M4", "Castrol", new BigDecimal("5"), new BigDecimal("11.90")),
                        new ServiceDtos.PartRequest("Filtro de aceite", "04E115561H", "Mann-Filter", BigDecimal.ONE, new BigDecimal("14.50"))),
                null));

        serviceRecordService.create(vehicleId, userId, new ServiceDtos.ServiceRecordRequest(
                LocalDate.now().minusMonths(8), 36_900, ServiceCategory.PREVENTIVE,
                "Filtro de habitáculo", rules.get("Filtro de habitáculo"),
                new BigDecimal("22.90"), BigDecimal.ZERO, PerformedBy.DIY,
                "Cambio rápido en el garaje antes del verano.",
                null,
                List.of(new ServiceDtos.PartRequest("Filtro de habitáculo con carbón activo", "1K1819653B", "Bosch", BigDecimal.ONE, new BigDecimal("22.90"))),
                null));

        serviceRecordService.create(vehicleId, userId, new ServiceDtos.ServiceRecordRequest(
                LocalDate.now().minusMonths(6), 41_000, ServiceCategory.LEGAL,
                "ITV", rules.get("ITV"),
                new BigDecimal("39.95"), BigDecimal.ZERO, PerformedBy.WORKSHOP,
                "Inspección favorable. Próxima cita en dos años.",
                null,
                List.of(),
                null));

        serviceRecordService.create(vehicleId, userId, new ServiceDtos.ServiceRecordRequest(
                LocalDate.now().minusMonths(4), 44_800, ServiceCategory.CORRECTIVE,
                "Pastillas de freno delanteras", null,
                new BigDecimal("113.00"), new BigDecimal("55.00"), PerformedBy.WORKSHOP,
                "Chirrido al frenar. Se sustituyen las pastillas delanteras.",
                null,
                List.of(new ServiceDtos.PartRequest("Juego de pastillas delanteras", "P85157", "Brembo", BigDecimal.ONE, new BigDecimal("58.00"))),
                null));
    }

    private static final class DemoClock {
        private final LocalDateTime start;

        private DemoClock(LocalDateTime start) {
            this.start = start;
        }

        private LocalDateTime next(int days) {
            return start.plusDays(days).withHour(18).withMinute(15);
        }
    }
}
