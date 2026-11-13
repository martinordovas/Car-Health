package com.carhealth.api.repository;

import com.carhealth.api.domain.ServiceRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {

    @EntityGraph(attributePaths = {"parts", "rule"})
    List<ServiceRecord> findByVehicleIdOrderByDateDescOdometerDesc(Long vehicleId);

    @EntityGraph(attributePaths = {"parts", "rule"})
    Optional<ServiceRecord> findByClientMutationId(String clientMutationId);

    @EntityGraph(attributePaths = {"rule"})
    List<ServiceRecord> findByVehicleIdOrderByDateAscOdometerAsc(Long vehicleId);

    @EntityGraph(attributePaths = {"parts", "rule"})
    Optional<ServiceRecord> findFirstByRuleIdOrderByDateDescOdometerDesc(Long ruleId);
}
