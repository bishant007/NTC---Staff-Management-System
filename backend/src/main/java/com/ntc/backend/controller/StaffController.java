package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.LeaveRequestDTO;
import com.ntc.backend.dto.LoginRequest;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import com.ntc.backend.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffController {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LeaveRequestService leaveRequestService;

    @GetMapping("/health")
    public String health() {
        return "Backend is Healthy";
    }

    @PostMapping("/login")
    public ApiResponse login(
            @RequestBody LoginRequest request
    ) {
        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getStaffId(),
                                    request.getPassword()
                            )
                    );

            UserDetails userDetails =
                    (UserDetails) authentication.getPrincipal();

            String token = jwtUtil.generateToken(userDetails);

            Staff staff = staffRepository
                    .findByStaffId(userDetails.getUsername())
                    .orElseThrow(() ->
                            new RuntimeException("Staff not found")
                    );

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("staffId", staff.getStaffId());
            data.put("fullName", staff.getFullName());
            data.put("email", staff.getEmail());
            data.put("department", staff.getDepartment());
            data.put("branch", staff.getBranch());
            data.put("isFirstLogin", staff.isFirstLogin());

            return new ApiResponse(
                    true,
                    "Login successful",
                    data
            );

        } catch (Exception e) {
            return new ApiResponse(
                    false,
                    "Invalid staff ID or password"
            );
        }
    }

    @PostMapping("/staff/leave-request")
    public ApiResponse submitLeaveRequest(
            @Valid @RequestBody LeaveRequestDTO dto
    ) {
        try {
            LeaveRequest request =
                    leaveRequestService.submitRequest(dto);

            return new ApiResponse(
                    true,
                    "Leave request submitted successfully",
                    request
            );

        } catch (RuntimeException e) {
            return new ApiResponse(
                    false,
                    e.getMessage()
            );
        }
    }

    @GetMapping("/staff/requests/{staffId}")
    public List<LeaveRequest> getMyRequests(
            @PathVariable String staffId
    ) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() ->
                        new RuntimeException("Staff not found")
                );

        return leaveRequestRepository.findByStaff(staff);
    }
}