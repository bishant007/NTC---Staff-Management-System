package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByStatus(RequestStatus status);
    long countByStatus(RequestStatus status);
    long countByCreatedAtBetween(Instant start, Instant end);
    List<LeaveRequest> findByStaff(Staff staff);

    List<LeaveRequest> findByStatusAndStaffSectionHeadId(RequestStatus status, Long sectionHeadId);
    List<LeaveRequest> findByStatusAndStaffDepartmentHeadId(RequestStatus status, Long departmentHeadId);
    List<LeaveRequest> findByStaffSectionHeadId(Long sectionHeadId);
    List<LeaveRequest> findByStaffDepartmentHeadId(Long departmentHeadId);

    /** Active = pending or approved (blocks overlap on new submissions). */
    @Query("SELECT r FROM LeaveRequest r WHERE r.staff = :staff " +
            "AND r.status IN (com.ntc.backend.enums.RequestStatus.PENDING_SECTION_HEAD, " +
            "                 com.ntc.backend.enums.RequestStatus.PENDING_DEPARTMENT_HEAD, " +
            "                 com.ntc.backend.enums.RequestStatus.APPROVED)")
    List<LeaveRequest> findActiveByStaff(@Param("staff") Staff staff);

    List<LeaveRequest> findByStatusAndStaffDepartmentAndStaffBranch(
            RequestStatus status, String department, String branch);
}