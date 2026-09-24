package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.LoginRequest;
import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private StaffRepository staffRepository;
    @Autowired private AdminRepository adminRepository;

    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            UserDetails ud = (UserDetails) auth.getPrincipal();
            String token = jwtUtil.generateToken(ud);

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("username", ud.getUsername());

            // Check admin first
            var adminOpt = adminRepository.findByUsername(ud.getUsername());
            if (adminOpt.isPresent()) {
                Admin a = adminOpt.get();
                data.put("role", "admin");
                data.put("fullName", a.getFullName());
                data.put("email", a.getEmail());
                data.put("adminId", a.getAdminId());
                return new ApiResponse(true, "Login successful", data);
            }

            Staff s = staffRepository.findByUsername(ud.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            data.put("role", s.getRole().name().toLowerCase());
            data.put("staffId", s.getStaffId());
            data.put("fullName", s.getFullName());
            data.put("email", s.getEmail());
            data.put("department", s.getDepartment());
            data.put("branch", s.getBranch());
            data.put("isFirstLogin", s.isFirstLogin());
            data.put("hasSignature", s.getSignaturePath() != null);

            return new ApiResponse(true, "Login successful", data);
        } catch (Exception e) {
            return new ApiResponse(false, "Invalid username or password");
        }
    }
}