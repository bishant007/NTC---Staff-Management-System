package com.ntc.backend.controller;

import com.ntc.backend.enums.LeaveCategory;
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

    private static final ZoneId NEPAL_ZONE = ZoneId.of("Asia/Kathmandu");

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

        long pending =
                leaveRequestRepository.countByStatus(RequestStatus.PENDING_SECTION_HEAD)
                        + leaveRequestRepository.countByStatus(RequestStatus.PENDING_OFFICE_INCHARGE)
                        + leaveRequestRepository.countByStatus(RequestStatus.PENDING_SELF_APPROVAL);
        stats.put("pendingRequests", pending);

        long onHold = leaveRequestRepository.countByStatus(RequestStatus.ON_HOLD);
        stats.put("onHoldRequests", onHold);

        long officeWorkTotal = leaveRequestRepository.countByCategory(LeaveCategory.OFFICE_WORK);
        stats.put("officeWorkRequests", officeWorkTotal);

        long officeWorkPending =
                leaveRequestRepository.countByCategoryAndStatus(LeaveCategory.OFFICE_WORK, RequestStatus.PENDING_SECTION_HEAD)
                        + leaveRequestRepository.countByCategoryAndStatus(LeaveCategory.OFFICE_WORK, RequestStatus.PENDING_OFFICE_INCHARGE)
                        + leaveRequestRepository.countByCategoryAndStatus(LeaveCategory.OFFICE_WORK, RequestStatus.PENDING_SELF_APPROVAL);
        stats.put("officeWorkPending", officeWorkPending);

        Instant start = LocalDate.now(NEPAL_ZONE).atStartOfDay(NEPAL_ZONE).toInstant();
        Instant end   = LocalDate.now(NEPAL_ZONE).plusDays(1).atStartOfDay(NEPAL_ZONE).toInstant();
        stats.put("todayRequests", leaveRequestRepository.countByCreatedAtBetween(start, end));

        long pendingResets = passwordResetRepository.findAll().stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .count();
        stats.put("passwordReset", pendingResets);

        return stats;
    }
}