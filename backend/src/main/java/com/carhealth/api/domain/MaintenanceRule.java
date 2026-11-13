package com.carhealth.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "maintenance_rules")
public class MaintenanceRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ServiceCategory category = ServiceCategory.PREVENTIVE;

    @Column(name = "interval_km")
    private Integer intervalKm;

    @Column(name = "interval_months")
    private Integer intervalMonths;

    @Column(name = "baseline_odometer")
    private Integer baselineOdometer;

    @Column(name = "baseline_date")
    private LocalDate baselineDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected MaintenanceRule() {
    }

    public MaintenanceRule(Vehicle vehicle, String name) {
        this.vehicle = vehicle;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }

    public Integer getIntervalKm() {
        return intervalKm;
    }

    public void setIntervalKm(Integer intervalKm) {
        this.intervalKm = intervalKm;
    }

    public Integer getIntervalMonths() {
        return intervalMonths;
    }

    public void setIntervalMonths(Integer intervalMonths) {
        this.intervalMonths = intervalMonths;
    }

    public Integer getBaselineOdometer() {
        return baselineOdometer;
    }

    public void setBaselineOdometer(Integer baselineOdometer) {
        this.baselineOdometer = baselineOdometer;
    }

    public LocalDate getBaselineDate() {
        return baselineDate;
    }

    public void setBaselineDate(LocalDate baselineDate) {
        this.baselineDate = baselineDate;
    }
}
