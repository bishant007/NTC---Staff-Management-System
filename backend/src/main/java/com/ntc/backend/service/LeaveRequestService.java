package com.ntc.backend.service;

import com.ntc.backend.dto.LeaveRequestDTO;
import com.ntc.backend.dto.LeaveRequestResponseDTO;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;

    @Transactional
    public LeaveRequestResponseDTO submitRequest(LeaveRequestDTO dto) {
        Staff staff = staffRepository.findByStaffId(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (staff.getRole() == StaffRole.DEPARTMENT_HEAD) {
            throw new RuntimeException(
                    "Department Heads cannot submit leave through this system. Please contact HR."
            );
        }

        RequestStatus initialStatus;
        if (staff.getRole() == StaffRole.SECTION_HEAD) {
            if (staff.getDepartmentHead() == null) {
                throw new RuntimeException("You have no department head assigned. Contact admin.");
            }
            initialStatus = RequestStatus.PENDING_DEPARTMENT_HEAD;
        } else {
            if (staff.getSectionHead() == null) {
                throw new RuntimeException(
                        "You are not assigned to a section head yet. Contact your department head."
                );
            }
            initialStatus = RequestStatus.PENDING_SECTION_HEAD;
        }

        // ---------- CHANGED: use startDateTime from DTO ----------
        Instant startInstant = dto.getStartDateTime()
                .atZone(ZoneId.systemDefault()).toInstant();
        Instant returnInstant = dto.getReturnDateTime()
                .atZone(ZoneId.systemDefault()).toInstant();

        if (returnInstant.isBefore(startInstant)) {
            throw new RuntimeException("Return date/time must be after start date/time");
        }
        if (returnInstant.isBefore(Instant.now())) {
            throw new RuntimeException("Return date/time must be in the future");
        }
        // ---------------------------------------------------------

        // ===== Overlap check against active requests =====
        List<LeaveRequest> active = leaveRequestRepository.findActiveByStaff(staff);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                .withZone(ZoneId.systemDefault());
        for (LeaveRequest existing : active) {
            boolean overlaps =
                    !existing.getLeaveStartTime().isAfter(returnInstant)
                            && !startInstant.isAfter(existing.getReturnDateTime());
            if (overlaps) {
                throw new RuntimeException(
                        "You already have an active request from " +
                                fmt.format(existing.getLeaveStartTime()) + " to " +
                                fmt.format(existing.getReturnDateTime()) +
                                " (" + existing.getStatus().name().replace('_', ' ') + "). " +
                                "Cancel it first or choose different dates."
                );
            }
        }

        LeaveRequest request = new LeaveRequest();
        request.setStaff(staff);
        request.setReason(dto.getReason());
        request.setLeaveStartTime(startInstant);
        request.setReturnDateTime(returnInstant);
        request.setLeaveType(dto.getLeaveType());
        request.setStatus(initialStatus);

        LeaveRequest saved = leaveRequestRepository.save(request);
        return LeaveRequestResponseDTO.from(saved);
    }

    @Transactional
    public void cancelRequest(Long requestId, String requesterStaffId) {
        LeaveRequest r = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!r.getStaff().getStaffId().equals(requesterStaffId)) {
            throw new RuntimeException("You can only cancel your own requests");
        }
        if (r.getStatus() != RequestStatus.PENDING_SECTION_HEAD
                && r.getStatus() != RequestStatus.PENDING_DEPARTMENT_HEAD) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        r.setStatus(RequestStatus.CANCELLED);
        leaveRequestRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getMyRequests(String staffId) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return leaveRequestRepository.findByStaff(staff).stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getPendingForSectionHead(String headStaffId) {
        Staff head = staffRepository.findByStaffId(headStaffId)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        return leaveRequestRepository
                .findByStatusAndStaffSectionHeadId(RequestStatus.PENDING_SECTION_HEAD, head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getPendingForDepartmentHead(String headStaffId) {
        Staff head = staffRepository.findByStaffId(headStaffId)
                .orElseThrow(() -> new RuntimeException("Department head not found"));
        return leaveRequestRepository
                .findByStatusAndStaffDepartmentHeadId(RequestStatus.PENDING_DEPARTMENT_HEAD, head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForSectionHead(String headStaffId) {
        Staff head = staffRepository.findByStaffId(headStaffId)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        return leaveRequestRepository.findByStaffSectionHeadId(head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForDepartmentHead(String headStaffId) {
        Staff head = staffRepository.findByStaffId(headStaffId)
                .orElseThrow(() -> new RuntimeException("Department head not found"));
        return leaveRequestRepository.findByStaffDepartmentHeadId(head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }
}