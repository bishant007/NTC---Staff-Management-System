package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.LeaveRequestDTO;
import com.ntc.backend.dto.LeaveRequestResponseDTO;
import com.ntc.backend.dto.LoginRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import com.ntc.backend.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StaffController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private LeaveRequestService leaveRequestService;

    @GetMapping("/health")
    public String health() { return "Backend is Healthy"; }

    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getStaffId(),
                            request.getPassword()
                    )
            );
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);

            Staff staff = staffRepository.findByStaffId(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Staff not found"));

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("staffId", staff.getStaffId());
            data.put("fullName", staff.getFullName());
            data.put("email", staff.getEmail());
            data.put("department", staff.getDepartment());
            data.put("branch", staff.getBranch());
            data.put("isFirstLogin", staff.isFirstLogin());
            data.put("role", staff.getRole().name().toLowerCase());
            data.put("hasSignature", staff.getSignaturePath() != null);

            return new ApiResponse(true, "Login successful", data);
        } catch (Exception e) {
            return new ApiResponse(false, "Invalid staff ID or password");
        }
    }

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

    // ---------- NEW: Cancel endpoint ----------
    @PutMapping("/staff/requests/{id}/cancel")
    public ApiResponse cancelRequest(@PathVariable Long id, Authentication auth) {
        try {
            leaveRequestService.cancelRequest(id, auth.getName());
            return new ApiResponse(true, "Request cancelled");
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }
}