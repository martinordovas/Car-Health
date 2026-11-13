package com.carhealth.api.repository;

import com.carhealth.api.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Vehicle> findByIdAndUserId(Long id, Long userId);
}
