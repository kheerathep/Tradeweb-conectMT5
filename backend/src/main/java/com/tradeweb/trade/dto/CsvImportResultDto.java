package com.tradeweb.trade.dto;

import java.util.ArrayList;
import java.util.List;

public class CsvImportResultDto {

    private int totalRows = 0;
    private int importedCount = 0;
    private int skippedCount = 0;
    private List<String> errors = new ArrayList<>();

    public CsvImportResultDto() {}

    public CsvImportResultDto(int totalRows, int importedCount, int skippedCount, List<String> errors) {
        this.totalRows = totalRows;
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getImportedCount() {
        return importedCount;
    }

    public void setImportedCount(int importedCount) {
        this.importedCount = importedCount;
    }

    public int getSkippedCount() {
        return skippedCount;
    }

    public void setSkippedCount(int skippedCount) {
        this.skippedCount = skippedCount;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }
}
