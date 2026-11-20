package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveCategory;
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

    List<LeaveRequest> findByStatusAndStaffId(RequestStatus status, Long staffId);
    List<LeaveRequest> findByStatusAndHeldById(RequestStatus status, Long heldById);

    long countByCategory(LeaveCategory category);
    long countByCategoryAndStatus(LeaveCategory category, RequestStatus status);

    long countByStaff(Staff staff);
    long countByStaffAndStatusIn(Staff staff, List<RequestStatus> statuses);

    @Query("SELECT r FROM LeaveRequest r WHERE r.staff = :staff " +
            "AND r.status IN (com.ntc.backend.enums.RequestStatus.PENDING_SECTION_HEAD, " +
            "                 com.ntc.backend.enums.RequestStatus.PENDING_OFFICE_INCHARGE, " +
            "                 com.ntc.backend.enums.RequestStatus.PENDING_SELF_APPROVAL, " +
            "                 com.ntc.backend.enums.RequestStatus.ON_HOLD, " +
            "                 com.ntc.backend.enums.RequestStatus.APPROVED)")
    List<LeaveRequest> findActiveByStaff(@Param("staff") Staff staff);

    // ---- Reference-number generation (MAX-based, gap-safe) ----

    /**
     * Highest numeric suffix currently used for the given prefix.
     * e.g. prefix "NTC/LEAVE/2026/" → returns 3 if "NTC/LEAVE/2026/0003" is the highest.
     * Returns NULL when no rows exist yet.
     */
    @Query("SELECT MAX(CAST(SUBSTRING(r.referenceNumber, LENGTH(:prefix) + 1) AS long)) " +
            "FROM LeaveRequest r " +
            "WHERE r.referenceNumber LIKE CONCAT(:prefix, '%') " +
            "AND LENGTH(r.referenceNumber) > LENGTH(:prefix)")
    Long findMaxSequenceForPrefix(@Param("prefix") String prefix);

    /** O(1) safety check before persisting a candidate reference number. */
    boolean existsByReferenceNumber(String referenceNumber);

    long countByReferenceNumberStartingWith(String prefix);
}