package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveBalance;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveType;
import com.ntc.backend.repository.LeaveBalanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaveBalanceService {

    private static final Logger log = LoggerFactory.getLogger(LeaveBalanceService.class);

    @Autowired private LeaveBalanceRepository leaveBalanceRepository;

    /** Default entitlements per personal leave type. Office work types are not tracked. */
    public static int defaultEntitlement(LeaveType type) {
        return switch (type) {
            case FULL_DAY, MULTI_DAY -> 30;
            case HALF_DAY            -> 60;
            case AFTER_HOUR          -> 30;
            case SICK                -> 10;
            case CASUAL              -> 12;
            case EMERGENCY           -> 5;
            case PERSONAL_OTHER      -> 30;
            default                  -> 0;
        };
    }

    private LeaveBalance getOrCreateBalance(Staff staff, LeaveType type) {
        return leaveBalanceRepository.findByStaffAndLeaveType(staff, type)
                .orElseGet(() -> {
                    LeaveBalance nb = new LeaveBalance();
                    nb.setStaff(staff);
                    nb.setLeaveType(type);
                    nb.setTotalEntitled(defaultEntitlement(type));
                    nb.setUsed(0);
                    return leaveBalanceRepository.save(nb);
                });
    }

    @Transactional
    public void deductLeave(Staff staff, LeaveType leaveType, int days) {
        deductDays(staff, leaveType, (double) days);
    }

    @Transactional
    public void deductDays(Staff staff, LeaveType leaveType, double days) {
        if (leaveType == null || leaveType.isOfficeWork()) return;

        LeaveBalance balance = getOrCreateBalance(staff, leaveType);
        if (balance.getUsed() + days > balance.getTotalEntitled() + 0.001) {
            throw new RuntimeException("Insufficient leave balance for " + leaveType
                    + " (needed " + days + ", remaining " + balance.getRemaining() + ")");
        }
        balance.setUsed(balance.getUsed() + days);
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void deductForRequest(LeaveRequest request) {
        LeaveType lt = request.getLeaveType();
        if (lt == null || lt.isOfficeWork()) return;

        double days = (request.getDurationDays() != null && request.getDurationDays() > 0)
                ? request.getDurationDays()
                : 1.0;
        deductDays(request.getStaff(), lt, days);
    }

    public LeaveBalance getBalance(Staff staff, LeaveType leaveType) {
        return leaveBalanceRepository.findByStaffAndLeaveType(staff, leaveType)
                .orElseThrow(() -> new RuntimeException("Leave balance not found"));
    }

    /**
     * Create balance rows for all PERSONAL leave types (office work is not tracked).
     *
     * ⚠️  REQUIRES_NEW is critical here — it runs in its own transaction so that a
     *     failure here can NEVER poison the caller's transaction. Without this,
     *     the classic "inner @Transactional fails → outer tx marked rollback-only →
     *     UnexpectedRollbackException" happens, which is what caused silent
     *     account-creation failures when the DB enum was stale.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void initializeBalances(Staff staff) {
        int created = 0;
        for (LeaveType type : LeaveType.values()) {
            if (type.isOfficeWork()) continue;
            if (leaveBalanceRepository.findByStaffAndLeaveType(staff, type).isPresent()) continue;

            try {
                LeaveBalance balance = new LeaveBalance();
                balance.setStaff(staff);
                balance.setLeaveType(type);
                balance.setTotalEntitled(defaultEntitlement(type));
                balance.setUsed(0);
                leaveBalanceRepository.save(balance);
                created++;
            } catch (Exception e) {
                log.warn("Could not initialize balance for {} / {}: {}",
                        staff.getStaffId(), type, e.getMessage());
                // Continue to the next type — one failure shouldn't block the rest
            }
        }
        if (created > 0) {
            log.info("Initialized {} leave balance row(s) for {}", created, staff.getStaffId());
        }
    }
}