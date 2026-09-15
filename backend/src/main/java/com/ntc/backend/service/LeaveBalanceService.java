package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveBalance;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveType;
import com.ntc.backend.repository.LeaveBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LeaveBalanceService {

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    // Deduct leave days (for approved requests)
    public void deductLeave(Staff staff, LeaveType leaveType, int days) {
        LeaveBalance balance = leaveBalanceRepository.findByStaffAndLeaveType(staff, leaveType)
                .orElseThrow(() -> new RuntimeException("Leave balance not found for " + leaveType));
        if (balance.getUsed() + days > balance.getTotalEntitled()) {
            throw new RuntimeException("Insufficient leave balance");
        }
        balance.setUsed(balance.getUsed() + days);
        leaveBalanceRepository.save(balance);
    }

    // Get balance for a specific staff and leave type
    public LeaveBalance getBalance(Staff staff, LeaveType leaveType) {
        return leaveBalanceRepository.findByStaffAndLeaveType(staff, leaveType)
                .orElseThrow(() -> new RuntimeException("Leave balance not found"));
    }

    // Initialize default balances for a new staff
    public void initializeBalances(Staff staff) {
        // Define entitlements per leave type (you can adjust)
        for (LeaveType type : LeaveType.values()) {
            int total = switch (type) {
                case FULL_DAY, MULTI_DAY -> 30;   // annual
                case HALF_DAY -> 60;
                case AFTER_HOUR -> 30;
                case SICK -> 10;
                case CASUAL -> 12;
                case EMERGENCY -> 5;
            };
            LeaveBalance balance = new LeaveBalance();
            balance.setStaff(staff);
            balance.setLeaveType(type);
            balance.setTotalEntitled(total);
            balance.setUsed(0);
            leaveBalanceRepository.save(balance);
        }
    }
}