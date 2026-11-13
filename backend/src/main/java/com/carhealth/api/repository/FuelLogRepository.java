package com.carhealth.api.repository;

import com.carhealth.api.domain.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {

    List<FuelLog> findByVehicleIdOrderByDateDescOdometerDesc(Long vehicleId);

    List<FuelLog> findByVehicleIdOrderByOdometerAsc(Long vehicleId);

    Optional<FuelLog> findFirstByVehicleIdOrderByOdometerDesc(Long vehicleId);

    Optional<FuelLog> findFirstByVehicleIdOrderByDateDescOdometerDesc(Long vehicleId);

    Optional<FuelLog> findByClientMutationId(String clientMutationId);
}
