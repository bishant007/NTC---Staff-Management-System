package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByStatus(RequestStatus status);
    long countByStatus(RequestStatus status);
    long countByCreatedAtBetween(Instant start, Instant end);
    List<LeaveRequest> findByStaff(Staff staff);

    List<LeaveRequest> findByStatusAndStaffSectionHeadId(RequestStatus status, Long sectionHeadId);
    List<LeaveRequest> findByStatusAndStaffOfficeInchargeId(RequestStatus status, Long officeInchargeId);
    List<LeaveRequest> findByStaffSectionHeadId(Long sectionHeadId);
    List<LeaveRequest> findByStaffOfficeInchargeId(Long officeInchargeId);

    @Query("SELECT r FROM LeaveRequest r WHERE r.staff = :staff " +
            "AND r.status IN (com.ntc.backend.enums.RequestStatus.PENDING_SECTION_HEAD, " +
            "                 com.ntc.backend.enums.RequestStatus.PENDING_OFFICE_INCHARGE, " +
            "                 com.ntc.backend.enums.RequestStatus.PENDING_SELF_APPROVAL, " +
            "                 com.ntc.backend.enums.RequestStatus.APPROVED)")
    List<LeaveRequest> findActiveByStaff(@Param("staff") Staff staff);

    long countByReferenceNumberStartingWith(String prefix);
}