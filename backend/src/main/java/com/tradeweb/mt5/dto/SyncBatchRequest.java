package com.tradeweb.mt5.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SyncBatchRequest {

    private String apiVersion = "1.0";
    private String batchId;
    private Long importJobId;
    private AccountInfoDto accountInfo;
    private Instant checkpoint;

    @NotNull(message = "Deals list is required")
    private List<DealDto> deals = new ArrayList<>();

    public SyncBatchRequest() {}

    public String getApiVersion() {
        return apiVersion;
    }

    public void setApiVersion(String apiVersion) {
        this.apiVersion = apiVersion;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public Long getImportJobId() {
        return importJobId;
    }

    public void setImportJobId(Long importJobId) {
        this.importJobId = importJobId;
    }

    public AccountInfoDto getAccountInfo() {
        return accountInfo;
    }

    public void setAccountInfo(AccountInfoDto accountInfo) {
        this.accountInfo = accountInfo;
    }

    public Instant getCheckpoint() {
        return checkpoint;
    }

    public void setCheckpoint(Instant checkpoint) {
        this.checkpoint = checkpoint;
    }

    public List<DealDto> getDeals() {
        return deals;
    }

    public void setDeals(List<DealDto> deals) {
        this.deals = deals;
    }
}
