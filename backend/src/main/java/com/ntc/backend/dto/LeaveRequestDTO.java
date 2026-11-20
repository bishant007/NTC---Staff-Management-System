package com.ntc.backend.dto;

import com.ntc.backend.enums.LeaveCategory;
import com.ntc.backend.enums.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class LeaveRequestDTO {

    @NotBlank private String staffId;
    @NotBlank private String reason;
    @NotNull  private LocalDateTime startDateTime;
    @NotNull  private LocalDateTime returnDateTime;
    @NotNull  private LeaveType leaveType;

    /** Office Work vs Personal. Defaults to PERSONAL if not supplied. */
    private LeaveCategory category = LeaveCategory.PERSONAL;

    /** Free-text description when leaveType is PERSONAL_OTHER or OFFICE_OTHER. */
    private String customLeaveType;

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }

    public LocalDateTime getReturnDateTime() { return returnDateTime; }
    public void setReturnDateTime(LocalDateTime returnDateTime) { this.returnDateTime = returnDateTime; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public LeaveCategory getCategory() { return category; }
    public void setCategory(LeaveCategory category) {
        this.category = category != null ? category : LeaveCategory.PERSONAL;
    }

    public String getCustomLeaveType() { return customLeaveType; }
    public void setCustomLeaveType(String customLeaveType) { this.customLeaveType = customLeaveType; }
}