package com.ntc.backend.controller;

import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.PasswordResetRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private PasswordResetRepository passwordResetRepository;

    @GetMapping
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = staffRepository.count();
        long totalStaff = staffRepository.countByRole(StaffRole.STAFF);
        long totalSH    = staffRepository.countByRole(StaffRole.SECTION_HEAD);
        long totalOI    = staffRepository.countByRole(StaffRole.OFFICE_INCHARGE);

        stats.put("totalUsers", totalUsers);
        stats.put("totalStaff", totalStaff);
        stats.put("totalSectionHeads", totalSH);
        stats.put("totalOfficeIncharge", totalOI);
        stats.put("activeUsers", totalUsers - staffRepository.countByIsFirstLogin(true));

        stats.put("fieldRequests", leaveRequestRepository.count());
        stats.put("pendingRequests",
                leaveRequestRepository.countByStatus(RequestStatus.PENDING_SECTION_HEAD)
                        + leaveRequestRepository.countByStatus(RequestStatus.PENDING_OFFICE_INCHARGE)
                        + leaveRequestRepository.countByStatus(RequestStatus.PENDING_SELF_APPROVAL));

        Instant start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end   = LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        stats.put("todayRequests", leaveRequestRepository.countByCreatedAtBetween(start, end));

        long pendingResets = passwordResetRepository.findAll().stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .count();
        stats.put("passwordReset", pendingResets);

        return stats;
    }
}