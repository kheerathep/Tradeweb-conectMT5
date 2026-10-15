package com.tradeweb.mt5.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sync_batches")
public class SyncBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "integration_id", nullable = false)
    private Long integrationId;

    @Column(name = "batch_id", length = 36)
    private String batchId;

    @Column(name = "records_received", nullable = false)
    private int recordsReceived = 0;

    @Column(name = "records_inserted", nullable = false)
    private int recordsInserted = 0;

    @Column(name = "records_duplicated", nullable = false)
    private int recordsDuplicated = 0;

    @Column(name = "records_rejected", nullable = false)
    private int recordsRejected = 0;

    @Column(name = "rejection_details", columnDefinition = "TEXT")
    private String rejectionDetails;

    @Column(name = "checkpoint_before")
    private Instant checkpointBefore;

    @Column(name = "checkpoint_after")
    private Instant checkpointAfter;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt = Instant.now();

    @Column(name = "processed_at")
    private Instant processedAt;

    public SyncBatch() {}

    public SyncBatch(Long integrationId, String batchId, int recordsReceived, Instant checkpointBefore) {
        this.integrationId = integrationId;
        this.batchId = batchId;
        this.recordsReceived = recordsReceived;
        this.checkpointBefore = checkpointBefore;
        this.receivedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIntegrationId() {
        return integrationId;
    }

    public void setIntegrationId(Long integrationId) {
        this.integrationId = integrationId;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getRecordsReceived() {
        return recordsReceived;
    }

    public void setRecordsReceived(int recordsReceived) {
        this.recordsReceived = recordsReceived;
    }

    public int getRecordsInserted() {
        return recordsInserted;
    }

    public void setRecordsInserted(int recordsInserted) {
        this.recordsInserted = recordsInserted;
    }

    public int getRecordsDuplicated() {
        return recordsDuplicated;
    }

    public void setRecordsDuplicated(int recordsDuplicated) {
        this.recordsDuplicated = recordsDuplicated;
    }

    public int getRecordsRejected() {
        return recordsRejected;
    }

    public void setRecordsRejected(int recordsRejected) {
        this.recordsRejected = recordsRejected;
    }

    public String getRejectionDetails() {
        return rejectionDetails;
    }

    public void setRejectionDetails(String rejectionDetails) {
        this.rejectionDetails = rejectionDetails;
    }

    public Instant getCheckpointBefore() {
        return checkpointBefore;
    }

    public void setCheckpointBefore(Instant checkpointBefore) {
        this.checkpointBefore = checkpointBefore;
    }

    public Instant getCheckpointAfter() {
        return checkpointAfter;
    }

    public void setCheckpointAfter(Instant checkpointAfter) {
        this.checkpointAfter = checkpointAfter;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }
}
