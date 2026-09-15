package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.ApprovalDTO;
import com.ntc.backend.dto.LeaveRequestResponseDTO;
import com.ntc.backend.dto.StaffCreateDTO;
import com.ntc.backend.dto.StaffResponseDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.ApprovalService;
import com.ntc.backend.service.LeaveRequestService;
import com.ntc.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/section-head")
@CrossOrigin(origins = "http://localhost:5173")
public class SectionHeadController {

    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private ApprovalService approvalService;
    @Autowired private StaffService staffService;
    @Autowired private StaffRepository staffRepository;

    @GetMapping("/requests")
    public List<LeaveRequestResponseDTO> getPendingRequests(Authentication auth) {
        return leaveRequestService.getPendingForSectionHead(auth.getName());
    }

    @GetMapping("/history")
    public List<LeaveRequestResponseDTO> getHistory(Authentication auth) {
        return leaveRequestService.getHistoryForSectionHead(auth.getName());
    }

    @PutMapping("/requests/{id}/approve")
    public ApiResponse approve(@PathVariable Long id, @RequestBody ApprovalDTO dto, Authentication auth) {
        approvalService.approveBySectionHead(id, dto.getSignature(), dto.getNotes(), auth.getName());
        return new ApiResponse(true, "Approved and forwarded to department head");
    }

    @PutMapping("/requests/{id}/reject")
    public ApiResponse reject(@PathVariable Long id, @RequestBody ApprovalDTO dto, Authentication auth) {
        approvalService.rejectBySectionHead(id, dto.getRejectionReason(), auth.getName());
        return new ApiResponse(true, "Request rejected");
    }

    // ---------- UPDATED: return credentials map ----------
    @PostMapping("/staff")
    public ApiResponse createStaff(@Valid @RequestBody StaffCreateDTO dto, Authentication auth) {
        java.util.Map<String, Object> result = staffService.createStaffWithCredentials(dto, auth.getName());
        return new ApiResponse(true, "Staff created", result);
    }

    @GetMapping("/my-staff")
    public List<StaffResponseDTO> myStaff(Authentication auth) {
        Staff head = staffRepository.findByStaffId(auth.getName())
                .orElseThrow(() -> new RuntimeException("Head not found"));
        return staffRepository.findBySectionHeadId(head.getId())
                .stream().map(StaffResponseDTO::from).collect(Collectors.toList());
    }
}