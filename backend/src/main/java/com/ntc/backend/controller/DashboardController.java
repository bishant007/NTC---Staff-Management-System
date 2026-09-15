package com.ntc.backend.controller;

import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
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

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @GetMapping
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();

        long totalStaff = staffRepository.count();
        stats.put("totalStaff", totalStaff);
        stats.put("activeStaff", totalStaff); // adjust if you have active flag

        long totalRequests = leaveRequestRepository.count();
        stats.put("fieldRequests", totalRequests);

        // Pending requests = both section-head and department-head pending statuses
        long pendingSectionHead = leaveRequestRepository.countByStatus(RequestStatus.PENDING_SECTION_HEAD);
        long pendingDeptHead = leaveRequestRepository.countByStatus(RequestStatus.PENDING_DEPARTMENT_HEAD);
        stats.put("pendingRequests", pendingSectionHead + pendingDeptHead);

        // Today's requests
        Instant start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        stats.put("todayRequests", leaveRequestRepository.countByCreatedAtBetween(start, end));

        stats.put("passwordReset", staffRepository.countByIsFirstLogin(true));

        return stats;
    }
}