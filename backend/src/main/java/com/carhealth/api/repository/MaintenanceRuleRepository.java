package com.carhealth.api.repository;

import com.carhealth.api.domain.MaintenanceRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRuleRepository extends JpaRepository<MaintenanceRule, Long> {

    List<MaintenanceRule> findByVehicleIdOrderByIdAsc(Long vehicleId);

    void deleteByVehicleId(Long vehicleId);
}
