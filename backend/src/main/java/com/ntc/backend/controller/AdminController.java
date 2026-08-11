package com.ntc.backend.controller;

import com.ntc.backend.dto.*;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.security.JwtUtil;
import com.ntc.backend.service.EmailService;
import com.ntc.backend.service.StaffService;
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
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private StaffService staffService;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private EmailService emailService;

    // ----- Admin Login -----
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

            return new ApiResponse(true, "Admin login successful", data);
        } catch (Exception e) {
            return new ApiResponse(false, "Invalid email or password");
        }
    }

    // ----- Create Staff (sends email with credentials) -----
    @PostMapping("/staff")
    public ApiResponse createStaff(@Valid @RequestBody StaffCreateDTO dto) {
        try {
            Staff created = staffService.createStaff(dto);
            return new ApiResponse(true, "Staff created. Credentials sent to email.", created);
        } catch (RuntimeException e) {
            return new ApiResponse(false, e.getMessage());
        }
    }

    // ----- Get all leave requests (optional filter by status) -----
    @GetMapping("/requests")
    public List<LeaveRequest> getRequests(@RequestParam(required = false) RequestStatus status) {
        if (status != null) {
            return leaveRequestRepository.findByStatus(status);
        }
        return leaveRequestRepository.findAll();
    }

    // ----- Update request status (and notify staff) -----
    @PutMapping("/requests/{id}/status")
    public ApiResponse updateRequestStatus(@PathVariable Long id,
                                           @Valid @RequestBody RequestStatusUpdateDTO dto) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(dto.getStatus());
        request.setAdminRemarks(dto.getAdminRemarks());
        leaveRequestRepository.save(request);

        // Send email notification to staff
        Staff staff = request.getStaff();
        emailService.sendRequestStatusUpdate(
                staff.getEmail(),
                staff.getStaffId(),
                dto.getStatus().toString(),
                dto.getAdminRemarks()
        );

        return new ApiResponse(true, "Request status updated", request);
    }
}