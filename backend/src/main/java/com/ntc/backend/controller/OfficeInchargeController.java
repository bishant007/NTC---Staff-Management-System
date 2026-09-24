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
    public List<LeaveRequestResponseDTO> pending(Authentication auth) {
        return leaveRequestService.getPendingForOfficeIncharge(auth.getName());
    }

    @GetMapping("/history")
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
    public List<StaffResponseDTO> mySectionHeads(Authentication auth) {
        Staff oi = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));
        return staffRepository.findByOfficeInchargeId(oi.getId()).stream()
                .filter(s -> s.getRole() == com.ntc.backend.enums.StaffRole.SECTION_HEAD)
                .map(StaffResponseDTO::from).collect(Collectors.toList());
    }

    @GetMapping("/my-staff")
    public List<StaffResponseDTO> myStaff(Authentication auth) {
        Staff oi = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));
        return staffRepository.findByOfficeInchargeId(oi.getId()).stream()
                .filter(s -> s.getRole() == com.ntc.backend.enums.StaffRole.STAFF)
                .map(StaffResponseDTO::from).collect(Collectors.toList());
    }
}