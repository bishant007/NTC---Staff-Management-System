package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ApprovalService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;

    // ================= SECTION HEAD =================
    @Transactional
    public void approveBySectionHead(Long requestId, String signature, String notes, String sectionHeadStaffId) {
        LeaveRequest request = getRequest(requestId);
        if (request.getStatus() != RequestStatus.PENDING_SECTION_HEAD) {
            throw new RuntimeException("Request is not pending for section head");
        }

        Staff head = staffRepository.findByStaffId(sectionHeadStaffId)
                .orElseThrow(() -> new RuntimeException("Section head not found"));

        Staff owner = request.getStaff();
        Staff assigned = owner.getSectionHead();
        if (assigned == null || !assigned.getStaffId().equals(head.getStaffId())) {
            throw new RuntimeException("You are not the assigned section head for this staff member");
        }

        request.setSectionHeadSignature(signature != null ? signature : head.getFullName());
        request.setSectionHeadNotes(notes);
        request.setSectionHeadApprovedAt(Instant.now());
        request.setStatus(RequestStatus.PENDING_DEPARTMENT_HEAD);
        leaveRequestRepository.save(request);

        try {
            emailService.sendRequestStatusUpdate(
                    owner.getEmail(), owner.getStaffId(),
                    "Forwarded to Department Head",
                    "Your leave request was approved by section head and is pending department head approval."
            );
        } catch (Exception ignored) {}
    }

    @Transactional
    public void rejectBySectionHead(Long requestId, String rejectionReason, String sectionHeadStaffId) {
        LeaveRequest request = getRequest(requestId);
        if (request.getStatus() != RequestStatus.PENDING_SECTION_HEAD) {
            throw new RuntimeException("Request is not pending for section head");
        }

        Staff head = staffRepository.findByStaffId(sectionHeadStaffId)
                .orElseThrow(() -> new RuntimeException("Section head not found"));

        Staff owner = request.getStaff();
        Staff assigned = owner.getSectionHead();
        if (assigned == null || !assigned.getStaffId().equals(head.getStaffId())) {
            throw new RuntimeException("You are not the assigned section head for this staff member");
        }

        request.setRejectionReason(rejectionReason);
        request.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(request);

        try {
            emailService.sendRequestStatusUpdate(
                    owner.getEmail(), owner.getStaffId(), "REJECTED",
                    "Your leave request was rejected by section head. Reason: " + rejectionReason
            );
        } catch (Exception ignored) {}
    }

    // ================= DEPARTMENT HEAD =================
    @Transactional
    public void approveByDepartmentHead(Long requestId, String signature, String notes, String deptHeadStaffId) {
        LeaveRequest request = getRequest(requestId);
        if (request.getStatus() != RequestStatus.PENDING_DEPARTMENT_HEAD) {
            throw new RuntimeException("Request is not pending for department head");
        }

        Staff head = staffRepository.findByStaffId(deptHeadStaffId)
                .orElseThrow(() -> new RuntimeException("Department head not found"));

        Staff owner = request.getStaff();
        Staff assigned = owner.getDepartmentHead();
        if (assigned == null || !assigned.getStaffId().equals(head.getStaffId())) {
            throw new RuntimeException("You are not the assigned department head for this staff member");
        }

        request.setDepartmentHeadSignature(signature != null ? signature : head.getFullName());
        request.setDepartmentHeadNotes(notes);
        request.setDepartmentHeadApprovedAt(Instant.now());
        request.setStatus(RequestStatus.APPROVED);
        leaveRequestRepository.save(request);

        try {
            leaveBalanceService.deductLeave(owner, request.getLeaveType(), 1);
        } catch (Exception ignored) {}

        try {
            emailService.sendRequestStatusUpdate(
                    owner.getEmail(), owner.getStaffId(), "APPROVED",
                    "Your leave request has been approved by department head."
            );
        } catch (Exception ignored) {}
    }

    @Transactional
    public void rejectByDepartmentHead(Long requestId, String rejectionReason, String deptHeadStaffId) {
        LeaveRequest request = getRequest(requestId);
        if (request.getStatus() != RequestStatus.PENDING_DEPARTMENT_HEAD) {
            throw new RuntimeException("Request is not pending for department head");
        }

        Staff head = staffRepository.findByStaffId(deptHeadStaffId)
                .orElseThrow(() -> new RuntimeException("Department head not found"));

        Staff owner = request.getStaff();
        Staff assigned = owner.getDepartmentHead();
        if (assigned == null || !assigned.getStaffId().equals(head.getStaffId())) {
            throw new RuntimeException("You are not the assigned department head for this staff member");
        }

        request.setRejectionReason(rejectionReason);
        request.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(request);

        try {
            emailService.sendRequestStatusUpdate(
                    owner.getEmail(), owner.getStaffId(), "REJECTED",
                    "Your leave request was rejected by department head. Reason: " + rejectionReason
            );
        } catch (Exception ignored) {}
    }

    private LeaveRequest getRequest(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
    }
}