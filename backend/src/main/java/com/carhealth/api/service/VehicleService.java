package com.carhealth.api.service;

import com.carhealth.api.domain.FuelType;
import com.carhealth.api.domain.MaintenanceRule;
import com.carhealth.api.domain.ServiceCategory;
import com.carhealth.api.domain.User;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.VehicleDtos;
import com.carhealth.api.error.ApiException;
import com.carhealth.api.repository.MaintenanceRuleRepository;
import com.carhealth.api.repository.UserRepository;
import com.carhealth.api.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final MaintenanceRuleRepository maintenanceRuleRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          UserRepository userRepository,
                          MaintenanceRuleRepository maintenanceRuleRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.maintenanceRuleRepository = maintenanceRuleRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleDtos.VehicleDto> list(Long userId) {
        return vehicleRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleDtos.VehicleDto get(Long vehicleId, Long userId) {
        return toDto(requireVehicle(vehicleId, userId));
    }

    @Transactional
    public VehicleDtos.VehicleDto create(Long userId, VehicleDtos.VehicleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("La sesión ya no es válida."));
        Vehicle vehicle = new Vehicle(user);
        apply(vehicle, request);
        vehicleRepository.save(vehicle);
        seedDefaultRules(vehicle);
        return toDto(vehicle);
    }

    @Transactional
    public VehicleDtos.VehicleDto update(Long vehicleId, Long userId, VehicleDtos.VehicleRequest request) {
        Vehicle vehicle = requireVehicle(vehicleId, userId);
        apply(vehicle, request);
        return toDto(vehicle);
    }

    @Transactional
    public void delete(Long vehicleId, Long userId) {
        Vehicle vehicle = requireVehicle(vehicleId, userId);
        vehicleRepository.delete(vehicle);
    }

    @Transactional(readOnly = true)
    public Vehicle requireVehicle(Long vehicleId, Long userId) {
        return vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> ApiException.notFound("Vehículo no encontrado."));
    }

    public VehicleDtos.VehicleDto toDto(Vehicle vehicle) {
        String name = vehicle.getNickname() != null && !vehicle.getNickname().isBlank()
                ? vehicle.getNickname().trim()
                : vehicle.getBrand() + " " + vehicle.getModel();
        return new VehicleDtos.VehicleDto(
                vehicle.getId(),
                name,
                vehicle.getNickname(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getEngineCode(),
                vehicle.getVin(),
                vehicle.getLicensePlate(),
                vehicle.getCurrentOdometer(),
                vehicle.getPurchaseDate(),
                vehicle.getPurchasePrice(),
                vehicle.getFuelType(),
                vehicle.getColor(),
                vehicle.getCreatedAt());
    }

    private void apply(Vehicle vehicle, VehicleDtos.VehicleRequest request) {
        vehicle.setBrand(request.brand().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setYear(request.year());
        vehicle.setNickname(trimToNull(request.nickname()));
        vehicle.setEngineCode(trimToNull(request.engineCode()));
        vehicle.setVin(trimToNull(request.vin()));
        vehicle.setLicensePlate(trimToNull(request.licensePlate()));
        vehicle.setCurrentOdometer(request.currentOdometer());
        vehicle.setPurchaseDate(request.purchaseDate());
        vehicle.setPurchasePrice(request.purchasePrice());
        vehicle.setFuelType(request.fuelType() != null ? request.fuelType() : FuelType.GASOLINE_95);
        vehicle.setColor(trimToNull(request.color()));
    }

    private void seedDefaultRules(Vehicle vehicle) {
        addRule(vehicle, "Aceite y filtro", ServiceCategory.PREVENTIVE, 15_000, 12);
        addRule(vehicle, "Filtro de aire", ServiceCategory.PREVENTIVE, 30_000, 24);
        addRule(vehicle, "Filtro de habitáculo", ServiceCategory.PREVENTIVE, 20_000, 12);
        addRule(vehicle, "Líquido de frenos", ServiceCategory.PREVENTIVE, 40_000, 24);
        addRule(vehicle, "Bujías", ServiceCategory.PREVENTIVE, 60_000, 48);
        addRule(vehicle, "ITV", ServiceCategory.LEGAL, null, 24);
    }

    private void addRule(Vehicle vehicle, String name, ServiceCategory category, Integer intervalKm, Integer intervalMonths) {
        MaintenanceRule rule = new MaintenanceRule(vehicle, name);
        rule.setCategory(category);
        rule.setIntervalKm(intervalKm);
        rule.setIntervalMonths(intervalMonths);
        rule.setBaselineOdometer(vehicle.getCurrentOdometer());
        rule.setBaselineDate(LocalDate.now());
        maintenanceRuleRepository.save(rule);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
