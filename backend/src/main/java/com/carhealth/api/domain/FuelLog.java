package com.carhealth.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "fuel_logs")
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "fuel_date", nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private Integer odometer;

    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal liters;

    @Column(name = "price_per_liter", nullable = false, precision = 7, scale = 3)
    private BigDecimal pricePerLiter;

    @Column(name = "total_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "station_name", length = 100)
    private String stationName;

    @Column(name = "station_location", length = 160)
    private String stationLocation;

    @Column(name = "is_full_tank", nullable = false)
    private boolean fullTank = true;

    @Column(name = "board_computer_avg", precision = 5, scale = 2)
    private BigDecimal boardComputerAvg;

    @Column(name = "reference_price", precision = 7, scale = 3)
    private BigDecimal referencePrice;

    @Column(name = "savings_amount", precision = 10, scale = 2)
    private BigDecimal savingsAmount;

    @Column(name = "savings_type", length = 24)
    private String savingsType;

    @Column(name = "computed_consumption", precision = 5, scale = 2)
    private BigDecimal computedConsumption;

    @Column(name = "client_mutation_id", length = 64)
    private String clientMutationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected FuelLog() {
    }

    public FuelLog(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public Integer getOdometer() {
        return odometer;
    }

    public void setOdometer(Integer odometer) {
        this.odometer = odometer;
    }

    public BigDecimal getLiters() {
        return liters;
    }

    public void setLiters(BigDecimal liters) {
        this.liters = liters;
    }

    public BigDecimal getPricePerLiter() {
        return pricePerLiter;
    }

    public void setPricePerLiter(BigDecimal pricePerLiter) {
        this.pricePerLiter = pricePerLiter;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getStationLocation() {
        return stationLocation;
    }

    public void setStationLocation(String stationLocation) {
        this.stationLocation = stationLocation;
    }

    public boolean isFullTank() {
        return fullTank;
    }

    public void setFullTank(boolean fullTank) {
        this.fullTank = fullTank;
    }

    public BigDecimal getBoardComputerAvg() {
        return boardComputerAvg;
    }

    public void setBoardComputerAvg(BigDecimal boardComputerAvg) {
        this.boardComputerAvg = boardComputerAvg;
    }

    public BigDecimal getReferencePrice() {
        return referencePrice;
    }

    public void setReferencePrice(BigDecimal referencePrice) {
        this.referencePrice = referencePrice;
    }

    public BigDecimal getSavingsAmount() {
        return savingsAmount;
    }

    public void setSavingsAmount(BigDecimal savingsAmount) {
        this.savingsAmount = savingsAmount;
    }

    public String getSavingsType() {
        return savingsType;
    }

    public void setSavingsType(String savingsType) {
        this.savingsType = savingsType;
    }

    public BigDecimal getComputedConsumption() {
        return computedConsumption;
    }

    public void setComputedConsumption(BigDecimal computedConsumption) {
        this.computedConsumption = computedConsumption;
    }

    public String getClientMutationId() {
        return clientMutationId;
    }

    public void setClientMutationId(String clientMutationId) {
        this.clientMutationId = clientMutationId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
