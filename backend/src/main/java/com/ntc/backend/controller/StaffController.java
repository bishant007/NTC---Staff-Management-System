package com.ntc.backend.controller;

import com.ntc.backend.dto.*;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.AuditLogService;
import com.ntc.backend.service.LeaveRequestService;
import com.ntc.backend.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StaffController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private SessionService sessionService;
    @Autowired private AuditLogService auditLogService;

    @GetMapping("/health")
    public String health() { return "Backend is Healthy"; }

    @PostMapping("/staff/leave-request")
    public ApiResponse submitLeaveRequest(@Valid @RequestBody LeaveRequestDTO dto) {
        try {
            LeaveRequestResponseDTO saved = leaveRequestService.submitRequest(dto);
            return new ApiResponse(true, "Leave request submitted successfully", saved);
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @GetMapping("/staff/requests/{staffId}")
    public List<LeaveRequestResponseDTO> getMyRequests(@PathVariable String staffId) {
        return leaveRequestService.getMyRequests(staffId);
    }

    @PutMapping("/staff/requests/{id}/cancel")
    public ApiResponse cancelRequest(@PathVariable Long id, Authentication auth) {
        try {
            leaveRequestService.cancelRequest(id, auth.getName());
            return new ApiResponse(true, "Request cancelled");
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @PostMapping("/staff/reset-password")
    public ApiResponse resetPassword(@Valid @RequestBody PasswordResetDTO dto) {
        Staff staff = staffRepository.findByStaffId(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        if (!passwordEncoder.matches(dto.getOldPassword(), staff.getPassword()))
            return new ApiResponse(false, "Incorrect current password");

        staff.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        staff.setFirstLogin(false);
        staffRepository.save(staff);

        try {
            auditLogService.record(staff.getUsername(), AuditAction.PASSWORD_CHANGED,
                    "STAFF", staff.getStaffId(), staff.getFullName(),
                    "User reset own password on first-login");
        } catch (Exception ignored) {}

        try {
            int revoked = sessionService.revokeAllForUser("STAFF", staff.getId(), "PASSWORD_CHANGED");
            System.out.println("🔐 Revoked " + revoked + " session(s) for " + staff.getStaffId() + " after password reset");
        } catch (Exception e) {
            System.out.println("Warning: could not revoke sessions after password reset — " + e.getMessage());
        }

        return new ApiResponse(true, "Password reset successful. Please login.");
    }
}