package com.ntc.backend.dto;

import com.ntc.backend.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public class RequestStatusUpdateDTO {

    @NotNull
    private RequestStatus status;

    private String adminRemarks;   // optional

    // getters and setters
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public String getAdminRemarks() { return adminRemarks; }
    public void setAdminRemarks(String adminRemarks) { this.adminRemarks = adminRemarks; }
}