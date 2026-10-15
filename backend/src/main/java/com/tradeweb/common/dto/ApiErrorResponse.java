package com.tradeweb.common.dto;

import java.time.Instant;
import java.util.List;

public class ApiErrorResponse {
    private String errorCode;
    private String message;
    private int status;
    private Instant timestamp;
    private String path;
    private List<ValidationError> validationErrors;

    public ApiErrorResponse() {
        this.timestamp = Instant.now();
    }

    public ApiErrorResponse(String errorCode, String message, int status, Instant timestamp, String path, List<ValidationError> validationErrors) {
        this.errorCode = errorCode;
        this.message = message;
        this.status = status;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.path = path;
        this.validationErrors = validationErrors;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public List<ValidationError> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(List<ValidationError> validationErrors) {
        this.validationErrors = validationErrors;
    }

    public static class ValidationError {
        private String field;
        private String rejectedValue;
        private String message;

        public ValidationError() {}

        public ValidationError(String field, String rejectedValue, String message) {
            this.field = field;
            this.rejectedValue = rejectedValue;
            this.message = message;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getRejectedValue() {
            return rejectedValue;
        }

        public void setRejectedValue(String rejectedValue) {
            this.rejectedValue = rejectedValue;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class Builder {
        private String errorCode;
        private String message;
        private int status;
        private Instant timestamp;
        private String path;
        private List<ValidationError> validationErrors;

        public Builder errorCode(String errorCode) {
            this.errorCode = errorCode;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder path(String path) {
            this.path = path;
            return this;
        }

        public Builder validationErrors(List<ValidationError> validationErrors) {
            this.validationErrors = validationErrors;
            return this;
        }

        public ApiErrorResponse build() {
            return new ApiErrorResponse(errorCode, message, status, timestamp, path, validationErrors);
        }
    }
}
