package com.ntc.backend.service;

import com.ntc.backend.dto.StaffCreateDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class StaffService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public Staff createStaff(StaffCreateDTO dto) {
        // Check if email already exists
        if (staffRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        Staff staff = new Staff();
        staff.setFullName(dto.getFullName());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(dto.getDepartment());
        staff.setBranch(dto.getBranch());

        // Generate unique staffId (e.g., NTC-XXXXXX)
        String staffId = "NTC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        staff.setStaffId(staffId);

        // Generate strong temporary password
        String rawPassword = RandomStringUtils.randomAlphanumeric(12);
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setFirstLogin(true);

        Staff saved = staffRepository.save(staff);

        // Send email
        emailService.sendStaffCredentials(staff.getEmail(), staffId, rawPassword);

        return saved;
    }
}