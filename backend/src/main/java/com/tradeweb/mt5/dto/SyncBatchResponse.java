package com.tradeweb.mt5.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SyncBatchResponse {

    private String batchId;
    private int totalReceived;
    private int insertedCount;
    private int duplicateCount;
    private int rejectedCount;
    private List<String> rejectionReasons = new ArrayList<>();
    private Instant newCheckpoint;
    private String status;
    private String message;

    public SyncBatchResponse() {}

    public SyncBatchResponse(String batchId, int totalReceived, int insertedCount, int duplicateCount, int rejectedCount) {
        this.batchId = batchId;
        this.totalReceived = totalReceived;
        this.insertedCount = insertedCount;
        this.duplicateCount = duplicateCount;
        this.rejectedCount = rejectedCount;
        if (rejectedCount == 0) {
            this.status = "SUCCESS";
            this.message = String.format("Processed %d deals (%d inserted, %d duplicates)", totalReceived, insertedCount, duplicateCount);
        } else if (insertedCount > 0 || duplicateCount > 0) {
            this.status = "PARTIAL";
            this.message = String.format("Partially processed: %d inserted, %d duplicates, %d rejected", insertedCount, duplicateCount, rejectedCount);
        } else {
            this.status = "FAILED";
            this.message = String.format("All %d deals failed validation", rejectedCount);
        }
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getTotalReceived() {
        return totalReceived;
    }

    public void setTotalReceived(int totalReceived) {
        this.totalReceived = totalReceived;
    }

    public int getInsertedCount() {
        return insertedCount;
    }

    public void setInsertedCount(int insertedCount) {
        this.insertedCount = insertedCount;
    }

    public int getDuplicateCount() {
        return duplicateCount;
    }

    public void setDuplicateCount(int duplicateCount) {
        this.duplicateCount = duplicateCount;
    }

    public int getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(int rejectedCount) {
        this.rejectedCount = rejectedCount;
    }

    public List<String> getRejectionReasons() {
        return rejectionReasons;
    }

    public void setRejectionReasons(List<String> rejectionReasons) {
        this.rejectionReasons = rejectionReasons;
    }

    public Instant getNewCheckpoint() {
        return newCheckpoint;
    }

    public void setNewCheckpoint(Instant newCheckpoint) {
        this.newCheckpoint = newCheckpoint;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
