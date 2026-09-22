package com.ntc.backend.controller;

import com.ntc.backend.dto.*;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import com.ntc.backend.service.EmailService;
import com.ntc.backend.service.LeaveRequestService;
import com.ntc.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private StaffService staffService;
    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;

    // ==================== Admin Login ====================
    @PostMapping("/login")
    public ApiResponse login(@RequestBody AdminLoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("email", userDetails.getUsername());
            data.put("role", "admin");

            return new ApiResponse(true, "Admin login successful", data);
        } catch (Exception e) {
            return new ApiResponse(false, "Invalid email or password");
        }
    }

    // ==================== Create Staff ====================
    @PostMapping("/staff")
    public ApiResponse createStaff(@Valid @RequestBody StaffCreateDTO dto) {
        try {
            Map<String, Object> created = staffService.createStaffWithCredentials(dto, null);
            return new ApiResponse(true,
                    "Staff created. Credentials sent to email and printed in console.", created);
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    // ==================== Get All Staff (with head info) ====================
    @GetMapping("/staff")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    // ==================== Get Single Staff ====================
    @GetMapping("/staff/{staffId}")
    @Transactional(readOnly = true)
    public ApiResponse getStaff(@PathVariable String staffId) {
        Staff s = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return new ApiResponse(true, "OK", toMap(s));
    }

    // ==================== Update Staff (roles, heads, password reset) ====================
    @PutMapping("/staff/{staffId}")
    @Transactional
    public ApiResponse updateStaff(@PathVariable String staffId,
                                   @RequestBody Map<String, Object> body) {
        Staff s = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (body.containsKey("fullName") && body.get("fullName") != null)
            s.setFullName((String) body.get("fullName"));
        if (body.containsKey("phone") && body.get("phone") != null)
            s.setPhone((String) body.get("phone"));
        if (body.containsKey("email") && body.get("email") != null)
            s.setEmail((String) body.get("email"));
        if (body.containsKey("department") && body.get("department") != null)
            s.setDepartment((String) body.get("department"));
        if (body.containsKey("branch") && body.get("branch") != null)
            s.setBranch((String) body.get("branch"));

        if (body.containsKey("role") && body.get("role") != null) {
            s.setRole(StaffRole.valueOf((String) body.get("role")));
        }

        // Section head assignment
        if (body.containsKey("sectionHeadId")) {
            Object shId = body.get("sectionHeadId");
            if (shId == null || ((String) shId).isBlank()) {
                s.setSectionHead(null);
            } else {
                Staff sh = staffRepository.findByStaffId((String) shId)
                        .orElseThrow(() -> new RuntimeException("Section head not found"));
                s.setSectionHead(sh);
            }
        }

        // Department head assignment
        if (body.containsKey("departmentHeadId")) {
            Object dhId = body.get("departmentHeadId");
            if (dhId == null || ((String) dhId).isBlank()) {
                s.setDepartmentHead(null);
            } else {
                Staff dh = staffRepository.findByStaffId((String) dhId)
                        .orElseThrow(() -> new RuntimeException("Department head not found"));
                s.setDepartmentHead(dh);
            }
        }

        // Optional password reset
        if (body.containsKey("newPassword") && body.get("newPassword") != null
                && !((String) body.get("newPassword")).isBlank()) {
            s.setPassword(passwordEncoder.encode((String) body.get("newPassword")));
            s.setFirstLogin(true);
        }

        staffRepository.save(s);
        return new ApiResponse(true, "Staff updated successfully", toMap(s));
    }

    // ==================== Get All Leave Requests (with full detail) ====================
    @GetMapping("/requests")
    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getRequests(
            @RequestParam(required = false) RequestStatus status) {
        List<LeaveRequest> list = (status != null)
                ? leaveRequestRepository.findByStatus(status)
                : leaveRequestRepository.findAll();
        return list.stream()
                .map(LeaveRequestResponseDTO::from)
                .collect(Collectors.toList());
    }

    // ==================== Admin override (kept for backward compat, UI no longer calls it) ====================
    @PutMapping("/requests/{id}/status")
    @Transactional
    public ApiResponse updateRequestStatus(@PathVariable Long id,
                                           @Valid @RequestBody RequestStatusUpdateDTO dto) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(dto.getStatus());
        request.setAdminRemarks(dto.getAdminRemarks());
        leaveRequestRepository.save(request);

        Staff staff = request.getStaff();
        try {
            emailService.sendRequestStatusUpdate(
                    staff.getEmail(),
                    staff.getStaffId(),
                    dto.getStatus().toString(),
                    dto.getAdminRemarks()
            );
        } catch (Exception ignored) {}

        return new ApiResponse(true, "Request status updated", request);
    }

    // ==================== Helper: Map Staff → flat map with head info ====================
    private Map<String, Object> toMap(Staff s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("staffId", s.getStaffId());
        m.put("fullName", s.getFullName());
        m.put("email", s.getEmail());
        m.put("phone", s.getPhone());
        m.put("department", s.getDepartment());
        m.put("branch", s.getBranch());
        m.put("role", s.getRole().name());

        if (s.getSectionHead() != null) {
            m.put("sectionHeadStaffId", s.getSectionHead().getStaffId());
            m.put("sectionHeadName", s.getSectionHead().getFullName());
        }
        if (s.getDepartmentHead() != null) {
            m.put("departmentHeadStaffId", s.getDepartmentHead().getStaffId());
            m.put("departmentHeadName", s.getDepartmentHead().getFullName());
        }
        m.put("hasSignature", s.getSignaturePath() != null);
        return m;
    }
}