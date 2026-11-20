package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveBalance;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    Optional<LeaveBalance> findByStaffAndLeaveType(Staff staff, LeaveType leaveType);

    /**
     * Remove every leave-balance row for a given staff member.
     * Called before hard-deleting a user account to satisfy FK constraints.
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM LeaveBalance lb WHERE lb.staff.id = :staffId")
    void deleteByStaffId(@Param("staffId") Long staffId);
}