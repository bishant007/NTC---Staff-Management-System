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
import java.time.LocalDate;
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

        RequestStatus initialStatus;
        switch (staff.getRole()) {
            case SECTION_HEAD -> {
                if (staff.getOfficeIncharge() == null)
                    throw new RuntimeException("You have no Office Incharge assigned. Contact admin.");
                initialStatus = RequestStatus.PENDING_OFFICE_INCHARGE;
            }
            case OFFICE_INCHARGE -> initialStatus = RequestStatus.PENDING_SELF_APPROVAL;
            default -> {
                if (staff.getSectionHead() == null)
                    throw new RuntimeException("You are not assigned to a Section Head yet.");
                initialStatus = RequestStatus.PENDING_SECTION_HEAD;
            }
        }

        Instant startInstant = dto.getStartDateTime().atZone(ZoneId.systemDefault()).toInstant();
        Instant returnInstant = dto.getReturnDateTime().atZone(ZoneId.systemDefault()).toInstant();

        if (returnInstant.isBefore(startInstant))
            throw new RuntimeException("Return date/time must be after start date/time");
        if (returnInstant.isBefore(Instant.now()))
            throw new RuntimeException("Return date/time must be in the future");

        List<LeaveRequest> active = leaveRequestRepository.findActiveByStaff(staff);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());
        for (LeaveRequest existing : active) {
            boolean overlaps = !existing.getLeaveStartTime().isAfter(returnInstant)
                    && !startInstant.isAfter(existing.getReturnDateTime());
            if (overlaps) {
                throw new RuntimeException("Overlap with existing request " + existing.getReferenceNumber()
                        + " (" + fmt.format(existing.getLeaveStartTime())
                        + " → " + fmt.format(existing.getReturnDateTime()) + ")");
            }
        }

        LeaveRequest r = new LeaveRequest();
        r.setStaff(staff);
        r.setReason(dto.getReason());
        r.setLeaveStartTime(startInstant);
        r.setReturnDateTime(returnInstant);
        r.setLeaveType(dto.getLeaveType());
        r.setStatus(initialStatus);
        r.setStaffSignature(dto.getSignature());
        r.setStaffSignedAt(Instant.now());
        r.setReferenceNumber(generateReferenceNumber());

        LeaveRequest saved = leaveRequestRepository.save(r);
        return LeaveRequestResponseDTO.from(saved);
    }

    private synchronized String generateReferenceNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "NTC/LEAVE/" + year + "/";
        long count = leaveRequestRepository.countByReferenceNumberStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    @Transactional
    public void cancelRequest(Long requestId, String requesterUsername) {
        LeaveRequest r = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!r.getStaff().getUsername().equals(requesterUsername))
            throw new RuntimeException("You can only cancel your own requests");
        if (r.getStatus() != RequestStatus.PENDING_SECTION_HEAD
                && r.getStatus() != RequestStatus.PENDING_OFFICE_INCHARGE
                && r.getStatus() != RequestStatus.PENDING_SELF_APPROVAL)
            throw new RuntimeException("Only pending requests can be cancelled");
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
    public List<LeaveRequestResponseDTO> getPendingForSectionHead(String username) {
        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        return leaveRequestRepository
                .findByStatusAndStaffSectionHeadId(RequestStatus.PENDING_SECTION_HEAD, head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getPendingForOfficeIncharge(String username) {
        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        List<LeaveRequest> pendingDept = leaveRequestRepository
                .findByStatusAndStaffOfficeInchargeId(RequestStatus.PENDING_OFFICE_INCHARGE, oi.getId());
        List<LeaveRequest> pendingSelf = leaveRequestRepository
                .findByStatusAndStaffOfficeInchargeId(RequestStatus.PENDING_SELF_APPROVAL, oi.getId());
        pendingDept.addAll(pendingSelf);
        return pendingDept.stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForSectionHead(String username) {
        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        return leaveRequestRepository.findByStaffSectionHeadId(head.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForOfficeIncharge(String username) {
        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        return leaveRequestRepository.findByStaffOfficeInchargeId(oi.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getAllRequests(RequestStatus status) {
        List<LeaveRequest> list = (status != null)
                ? leaveRequestRepository.findByStatus(status)
                : leaveRequestRepository.findAll();
        return list.stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }
}