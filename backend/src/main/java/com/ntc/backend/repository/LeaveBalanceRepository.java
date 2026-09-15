package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveBalance;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    Optional<LeaveBalance> findByStaffAndLeaveType(Staff staff, LeaveType leaveType);
}