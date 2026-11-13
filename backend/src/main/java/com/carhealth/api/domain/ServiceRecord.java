package com.carhealth.api.domain;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_records")
public class ServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id")
    private MaintenanceRule rule;

    @Column(name = "service_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer odometer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ServiceCategory category;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(name = "total_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "labor_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal laborCost = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "performed_by", nullable = false, length = 16)
    private PerformedBy performedBy = PerformedBy.WORKSHOP;

    @Column(length = 2000)
    private String notes;

    @Column(name = "invoice_file_path", length = 500)
    private String invoiceFilePath;

    @Column(name = "client_mutation_id", length = 64)
    private String clientMutationId;

    @OneToMany(mappedBy = "serviceRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<PartItem> parts = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ServiceRecord() {
    }

    public ServiceRecord(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public void addPart(PartItem part) {
        parts.add(part);
        part.setServiceRecord(this);
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public MaintenanceRule getRule() {
        return rule;
    }

    public void setRule(MaintenanceRule rule) {
        this.rule = rule;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getOdometer() {
        return odometer;
    }

    public void setOdometer(Integer odometer) {
        this.odometer = odometer;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public BigDecimal getLaborCost() {
        return laborCost;
    }

    public void setLaborCost(BigDecimal laborCost) {
        this.laborCost = laborCost;
    }

    public PerformedBy getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(PerformedBy performedBy) {
        this.performedBy = performedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getInvoiceFilePath() {
        return invoiceFilePath;
    }

    public void setInvoiceFilePath(String invoiceFilePath) {
        this.invoiceFilePath = invoiceFilePath;
    }

    public String getClientMutationId() {
        return clientMutationId;
    }

    public void setClientMutationId(String clientMutationId) {
        this.clientMutationId = clientMutationId;
    }

    public List<PartItem> getParts() {
        return parts;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
