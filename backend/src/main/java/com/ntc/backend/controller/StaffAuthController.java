package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.LoginDTO;
import com.ntc.backend.dto.PasswordResetDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffAuthController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;

    @PostMapping("/reset-password")
    public ApiResponse resetPassword(@Valid @RequestBody PasswordResetDTO dto) {
        Staff staff = staffRepository.findByStaffId(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (!passwordEncoder.matches(dto.getOldPassword(), staff.getPassword())) {
            return new ApiResponse(false, "Incorrect current password");
        }

        staff.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        staff.setFirstLogin(false);
        staffRepository.save(staff);

        return new ApiResponse(true, "Password reset successful. Please login.");
    }

    @PostMapping("/login")
    public ApiResponse login(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
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
            return new ApiResponse(false, "Invalid credentials");
        }
    }
}