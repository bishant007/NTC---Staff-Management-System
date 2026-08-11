package com.ntc.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class LeaveRequestDTO {

    @NotBlank
    private String staffId;

    @NotBlank
    private String reason;

    @NotNull
    @Future(message = "Return date/time must be in the future")
    private Instant returnDateTime;

    // getters and setters
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getReturnDateTime() { return returnDateTime; }
    public void setReturnDateTime(Instant returnDateTime) { this.returnDateTime = returnDateTime; }
}