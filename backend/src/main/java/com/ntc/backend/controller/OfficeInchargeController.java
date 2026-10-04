package com.ntc.backend.controller;

import com.ntc.backend.dto.*;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.ApprovalService;
import com.ntc.backend.service.LeaveRequestService;
import com.ntc.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/office-incharge")
public class OfficeInchargeController {

    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private ApprovalService approvalService;
    @Autowired private StaffService staffService;
    @Autowired private StaffRepository staffRepository;

    @GetMapping("/requests")
    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> pending(Authentication auth) {
        return leaveRequestService.getPendingForOfficeIncharge(auth.getName());
    }

    @GetMapping("/history")
    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> history(Authentication auth) {
        return leaveRequestService.getHistoryForOfficeIncharge(auth.getName());
    }

    @PutMapping("/requests/{id}/approve")
    public ApiResponse approve(@PathVariable Long id, @RequestBody ApprovalDTO dto, Authentication auth) {
        approvalService.approveByOfficeIncharge(id, dto.getSignature(), dto.getNotes(), auth.getName());
        return new ApiResponse(true, "Request approved");
    }

    @PutMapping("/requests/{id}/reject")
    public ApiResponse reject(@PathVariable Long id, @RequestBody ApprovalDTO dto, Authentication auth) {
        approvalService.rejectByOfficeIncharge(id, dto.getSignature(), dto.getRejectionReason(), auth.getName());
        return new ApiResponse(true, "Request rejected");
    }

    @PostMapping("/staff")
    public ApiResponse createStaff(@Valid @RequestBody StaffCreateDTO dto, Authentication auth) {
        Map<String, Object> r = staffService.createStaffWithCredentials(dto, auth.getName());
        return new ApiResponse(true, "Staff created", r);
    }

    @GetMapping("/my-section-heads")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> mySectionHeads(Authentication auth) {
        Staff oi = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));
        return staffRepository.findByOfficeInchargeId(oi.getId()).stream()
                .filter(s -> s.getRole() == com.ntc.backend.enums.StaffRole.SECTION_HEAD)
                .map(StaffResponseDTO::from).collect(Collectors.toList());
    }

    @GetMapping("/my-staff")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> myStaff(Authentication auth) {
        Staff oi = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));
        return staffRepository.findByOfficeInchargeId(oi.getId()).stream()
                .filter(s -> s.getRole() == com.ntc.backend.enums.StaffRole.STAFF)
                .map(StaffResponseDTO::from).collect(Collectors.toList());
    }

    /* ---------------- Delete / Deactivate / Activate ---------------- */

    @GetMapping("/staff/{staffId}/delete-check")
    public ApiResponse checkDelete(@PathVariable String staffId, Authentication auth) {
        try {
            Map<String, Object> info = staffService.checkDeleteEligibility(staffId, auth.getName());
            return new ApiResponse(true, "OK", info);
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @DeleteMapping("/staff/{staffId}")
    public ApiResponse hardDelete(@PathVariable String staffId, Authentication auth) {
        try {
            staffService.deleteStaff(staffId, auth.getName());
            return new ApiResponse(true, "User permanently deleted");
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @PutMapping("/staff/{staffId}/deactivate")
    public ApiResponse deactivate(@PathVariable String staffId, Authentication auth) {
        try {
            staffService.deactivateStaff(staffId, auth.getName());
            return new ApiResponse(true, "User deactivated");
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @PutMapping("/staff/{staffId}/activate")
    public ApiResponse activate(@PathVariable String staffId, Authentication auth) {
        try {
            staffService.activateStaff(staffId, auth.getName());
            return new ApiResponse(true, "User reactivated");
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }
}