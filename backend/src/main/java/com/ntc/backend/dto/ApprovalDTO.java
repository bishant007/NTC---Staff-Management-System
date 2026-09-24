package com.ntc.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ApprovalDTO {
    private Long requestId;
    @NotBlank private String signature;
    private String rejectionReason;
    private String notes;
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}