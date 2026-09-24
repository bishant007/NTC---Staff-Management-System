package com.ntc.backend.controller;

import com.ntc.backend.dto.*;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.EmailService;
import com.ntc.backend.service.LeaveRequestService;
import com.ntc.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private StaffService staffService;
    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/staff")
    public ApiResponse createStaff(@Valid @RequestBody StaffCreateDTO dto) {
        try {
            Map<String, Object> created = staffService.createStaffWithCredentials(dto, null);
            return new ApiResponse(true, "Staff created. Credentials sent to email.", created);
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    @GetMapping("/staff")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getAllStaff() {
        return staffRepository.findAll().stream().map(StaffResponseDTO::from).collect(Collectors.toList());
    }

    @GetMapping("/staff/{staffId}")
    @Transactional(readOnly = true)
    public ApiResponse getStaff(@PathVariable String staffId) {
        Staff s = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return new ApiResponse(true, "OK", StaffResponseDTO.from(s));
    }

    @PutMapping("/staff/{staffId}")
    @Transactional
    public ApiResponse updateStaff(@PathVariable String staffId, @RequestBody Map<String, Object> body) {
        Staff s = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (body.get("fullName") != null) s.setFullName((String) body.get("fullName"));
        if (body.get("phone") != null) s.setPhone((String) body.get("phone"));
        if (body.get("email") != null) s.setEmail((String) body.get("email"));
        if (body.get("department") != null) s.setDepartment((String) body.get("department"));
        if (body.get("branch") != null) s.setBranch((String) body.get("branch"));
        if (body.get("username") != null) s.setUsername((String) body.get("username"));
        if (body.get("role") != null) s.setRole(StaffRole.valueOf((String) body.get("role")));

        if (body.containsKey("sectionHeadId")) {
            Object v = body.get("sectionHeadId");
            s.setSectionHead(v == null || v.toString().isBlank() ? null :
                    staffRepository.findByStaffId(v.toString())
                            .orElseThrow(() -> new RuntimeException("Section head not found")));
        }
        if (body.containsKey("officeInchargeId")) {
            Object v = body.get("officeInchargeId");
            s.setOfficeIncharge(v == null || v.toString().isBlank() ? null :
                    staffRepository.findByStaffId(v.toString())
                            .orElseThrow(() -> new RuntimeException("Office Incharge not found")));
        }

        if (body.get("newPassword") != null && !((String) body.get("newPassword")).isBlank()) {
            s.setPassword(passwordEncoder.encode((String) body.get("newPassword")));
            s.setFirstLogin(true);
        }

        staffRepository.save(s);
        return new ApiResponse(true, "Staff updated", StaffResponseDTO.from(s));
    }

    @GetMapping("/requests")
    public List<LeaveRequestResponseDTO> getRequests(@RequestParam(required = false) RequestStatus status) {
        return leaveRequestService.getAllRequests(status);
    }
}