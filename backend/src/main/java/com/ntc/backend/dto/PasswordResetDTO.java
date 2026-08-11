package com.ntc.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class PasswordResetDTO {

    @NotBlank
    private String staffId;

    @NotBlank
    private String oldPassword;

    @NotBlank
    private String newPassword;

    // getters and setters
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getOldPassword() { return oldPassword; }
    public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}