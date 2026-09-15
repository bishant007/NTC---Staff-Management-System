package com.ntc.backend.service;

import com.ntc.backend.dto.StaffCreateDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.StaffRepository;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class StaffService {

    @Autowired private StaffRepository staffRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;

    /** Backwards-compatible entry point for admin (no creator). */
    public Staff createStaff(StaffCreateDTO dto) {
        return createStaff(dto, null);
    }

    @Transactional
    public Staff createStaff(StaffCreateDTO dto, String creatorStaffId) {

        if (staffRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        Staff creator = null;
        if (creatorStaffId != null) {
            creator = staffRepository.findByStaffId(creatorStaffId)
                    .orElseThrow(() -> new RuntimeException("Creator not found"));

            if (creator.getRole() == StaffRole.SECTION_HEAD) {
                if (dto.getRole() != null && dto.getRole() != StaffRole.STAFF) {
                    throw new RuntimeException("Section heads can only create STAFF accounts");
                }
                dto.setRole(StaffRole.STAFF);
            } else if (creator.getRole() == StaffRole.DEPARTMENT_HEAD) {
                if (dto.getRole() != null
                        && dto.getRole() != StaffRole.SECTION_HEAD
                        && dto.getRole() != StaffRole.STAFF) {
                    throw new RuntimeException("Department heads can create SECTION_HEAD or STAFF accounts");
                }
                if (dto.getRole() == null) {
                    dto.setRole(StaffRole.SECTION_HEAD);
                }
            }
        }

        Staff staff = new Staff();
        staff.setFullName(dto.getFullName());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(dto.getDepartment());
        staff.setBranch(dto.getBranch());
        staff.setRole(dto.getRole() != null ? dto.getRole() : StaffRole.STAFF);

        String staffId = "NTC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        staff.setStaffId(staffId);

        String rawPassword = RandomStringUtils.randomAlphanumeric(12);
        System.out.println("🔑 TEMP PASSWORD for " + staff.getEmail() + " : " + rawPassword);
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setFirstLogin(true);

        Staff sectionHead = null;
        Staff departmentHead = null;

        if (dto.getSectionHeadId() != null && !dto.getSectionHeadId().isBlank()) {
            sectionHead = staffRepository.findByStaffId(dto.getSectionHeadId())
                    .orElseThrow(() -> new RuntimeException("Section head not found: " + dto.getSectionHeadId()));
        }
        if (dto.getDepartmentHeadId() != null && !dto.getDepartmentHeadId().isBlank()) {
            departmentHead = staffRepository.findByStaffId(dto.getDepartmentHeadId())
                    .orElseThrow(() -> new RuntimeException("Department head not found: " + dto.getDepartmentHeadId()));
        }

        if (creator != null) {
            if (creator.getRole() == StaffRole.SECTION_HEAD && sectionHead == null) {
                sectionHead = creator;
            }
            if (creator.getRole() == StaffRole.DEPARTMENT_HEAD && departmentHead == null) {
                departmentHead = creator;
            }
            if (creator.getRole() == StaffRole.SECTION_HEAD && departmentHead == null) {
                departmentHead = creator.getDepartmentHead();
            }
            staff.setCreatedBy(creator);
        }

        if (departmentHead == null && sectionHead != null) {
            departmentHead = sectionHead.getDepartmentHead();
        }

        staff.setSectionHead(sectionHead);
        staff.setDepartmentHead(departmentHead);

        Staff saved = staffRepository.save(staff);

        try {
            emailService.sendStaffCredentials(saved.getEmail(), staffId, rawPassword);
        } catch (Exception ignored) { }

        try {
            leaveBalanceService.initializeBalances(saved);
        } catch (Exception ignored) { }

        return saved;
    }

    // ---------- NEW: create staff and return credentials map ----------
    @Transactional
    public java.util.Map<String, Object> createStaffWithCredentials(StaffCreateDTO dto, String creatorStaffId) {
        if (staffRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        Staff creator = null;
        if (creatorStaffId != null) {
            creator = staffRepository.findByStaffId(creatorStaffId)
                    .orElseThrow(() -> new RuntimeException("Creator not found"));

            if (creator.getRole() == StaffRole.SECTION_HEAD) {
                if (dto.getRole() != null && dto.getRole() != StaffRole.STAFF) {
                    throw new RuntimeException("Section heads can only create STAFF accounts");
                }
                dto.setRole(StaffRole.STAFF);
            } else if (creator.getRole() == StaffRole.DEPARTMENT_HEAD) {
                if (dto.getRole() != null
                        && dto.getRole() != StaffRole.SECTION_HEAD
                        && dto.getRole() != StaffRole.STAFF) {
                    throw new RuntimeException("Department heads can create SECTION_HEAD or STAFF accounts");
                }
                if (dto.getRole() == null) {
                    dto.setRole(StaffRole.SECTION_HEAD);
                }
            }
        }

        Staff staff = new Staff();
        staff.setFullName(dto.getFullName());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(dto.getDepartment());
        staff.setBranch(dto.getBranch());
        staff.setRole(dto.getRole() != null ? dto.getRole() : StaffRole.STAFF);

        String staffId = "NTC-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        staff.setStaffId(staffId);

        String rawPassword = RandomStringUtils.randomAlphanumeric(12);
        System.out.println("🔑 TEMP PASSWORD for " + staff.getEmail() + " : " + rawPassword);
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setFirstLogin(true);

        Staff sectionHead = null;
        Staff departmentHead = null;

        if (dto.getSectionHeadId() != null && !dto.getSectionHeadId().isBlank()) {
            sectionHead = staffRepository.findByStaffId(dto.getSectionHeadId())
                    .orElseThrow(() -> new RuntimeException("Section head not found"));
        }
        if (dto.getDepartmentHeadId() != null && !dto.getDepartmentHeadId().isBlank()) {
            departmentHead = staffRepository.findByStaffId(dto.getDepartmentHeadId())
                    .orElseThrow(() -> new RuntimeException("Department head not found"));
        }

        if (creator != null) {
            if (creator.getRole() == StaffRole.SECTION_HEAD && sectionHead == null) {
                sectionHead = creator;
            }
            if (creator.getRole() == StaffRole.DEPARTMENT_HEAD && departmentHead == null) {
                departmentHead = creator;
            }
            if (creator.getRole() == StaffRole.SECTION_HEAD && departmentHead == null) {
                departmentHead = creator.getDepartmentHead();
            }
            staff.setCreatedBy(creator);
        }

        if (departmentHead == null && sectionHead != null) {
            departmentHead = sectionHead.getDepartmentHead();
        }

        staff.setSectionHead(sectionHead);
        staff.setDepartmentHead(departmentHead);

        Staff saved = staffRepository.save(staff);

        try { emailService.sendStaffCredentials(saved.getEmail(), staffId, rawPassword); }
        catch (Exception ignored) {}
        try { leaveBalanceService.initializeBalances(saved); }
        catch (Exception ignored) {}

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("staffId", saved.getStaffId());
        res.put("fullName", saved.getFullName());
        res.put("email", saved.getEmail());
        res.put("tempPassword", rawPassword);
        res.put("role", saved.getRole().name());
        return res;
    }
}