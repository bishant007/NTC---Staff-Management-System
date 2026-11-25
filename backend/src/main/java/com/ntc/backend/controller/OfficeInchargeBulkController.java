package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.StaffResponseDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/office-incharge/bulk")
public class OfficeInchargeBulkController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AuditLogService auditLogService;

    private Staff currentOI(Authentication auth) {
        if (auth == null || auth.getName() == null)
            throw new RuntimeException("Not authenticated");
        Staff s = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (s.getRole() != StaffRole.OFFICE_INCHARGE)
            throw new RuntimeException("Only Office In-Charges can use this endpoint");
        return s;
    }

    /* ------------ Listing endpoints ------------ */

    /** Unassigned Section Heads (no OI). */
    @GetMapping("/unassigned-section-heads")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getUnassignedSHs(Authentication auth) {
        currentOI(auth);
        return staffRepository.findAll().stream()
                .filter(Staff::isActive)
                .filter(s -> s.getRole() == StaffRole.SECTION_HEAD)
                .filter(s -> s.getOfficeIncharge() == null)
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /** Unassigned STAFF (no SH). */
    @GetMapping("/unassigned-staff")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getUnassignedStaff(Authentication auth) {
        currentOI(auth);
        return staffRepository.findAll().stream()
                .filter(Staff::isActive)
                .filter(s -> s.getRole() == StaffRole.STAFF)
                .filter(s -> s.getSectionHead() == null)
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /** Section Heads under me — for the "assign staff to which SH" picker + unassign list. */
    @GetMapping("/my-section-heads")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getMySHs(Authentication auth) {
        Staff oi = currentOI(auth);
        return staffRepository.findByOfficeInchargeId(oi.getId()).stream()
                .filter(s -> s.getRole() == StaffRole.SECTION_HEAD)
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /** Staff whose SH is under me — for bulk unassign-from-SH. */
    @GetMapping("/staff-under-my-shs")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getStaffUnderMySHs(Authentication auth) {
        Staff oi = currentOI(auth);
        List<Staff> shs = staffRepository.findByOfficeInchargeId(oi.getId());
        if (shs.isEmpty()) return List.of();
        List<Long> shIds = shs.stream().map(Staff::getId).toList();
        return staffRepository.findAll().stream()
                .filter(s -> s.getRole() == StaffRole.STAFF)
                .filter(s -> s.getSectionHead() != null && shIds.contains(s.getSectionHead().getId()))
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /* ------------ Bulk actions ------------ */

    @PostMapping("/assign-section-heads")
    @Transactional
    public ApiResponse assignSHsToMe(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentOI(auth);
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No Section Heads selected");

        int assigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getRole() != StaffRole.SECTION_HEAD) { skipped.add(staffId + " (not a Section Head)"); continue; }
            if (!s.isActive()) { skipped.add(staffId + " (inactive)"); continue; }
            if (s.getOfficeIncharge() != null) { skipped.add(staffId + " (already has an Office In-Charge)"); continue; }
            s.setOfficeIncharge(me);
            staffRepository.save(s);
            assigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "SECTION_HEAD_BULK", null, null,
                    "Bulk-assigned " + assigned + " Section Heads to self");
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("assigned", assigned);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Assigned " + assigned + " Section Head(s) to you", data);
    }

    @PostMapping("/unassign-section-heads")
    @Transactional
    public ApiResponse unassignSHsFromMe(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentOI(auth);
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No Section Heads selected");

        int unassigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getOfficeIncharge() == null || !s.getOfficeIncharge().getId().equals(me.getId())) {
                skipped.add(staffId + " (not under you)");
                continue;
            }
            s.setOfficeIncharge(null);
            staffRepository.save(s);
            unassigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "SECTION_HEAD_BULK", null, null,
                    "Bulk-unassigned " + unassigned + " Section Heads from self");
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("unassigned", unassigned);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Unassigned " + unassigned + " Section Head(s)", data);
    }

    @PostMapping("/assign-staff-to-sh")
    @Transactional
    public ApiResponse assignStaffToSH(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentOI(auth);
        List<String> ids = extractIds(body);
        String shStaffId = String.valueOf(body.getOrDefault("sectionHeadId", "")).trim();
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");
        if (shStaffId.isEmpty()) return new ApiResponse(false, "Please pick a Section Head");

        Staff sh = staffRepository.findByStaffId(shStaffId).orElse(null);
        if (sh == null || sh.getRole() != StaffRole.SECTION_HEAD)
            return new ApiResponse(false, "Target is not a Section Head");
        if (sh.getOfficeIncharge() == null || !sh.getOfficeIncharge().getId().equals(me.getId()))
            return new ApiResponse(false, "That Section Head is not under you");

        int assigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getRole() != StaffRole.STAFF) { skipped.add(staffId + " (not a STAFF role)"); continue; }
            if (!s.isActive()) { skipped.add(staffId + " (inactive)"); continue; }
            if (s.getSectionHead() != null) { skipped.add(staffId + " (already has a Section Head)"); continue; }
            s.setSectionHead(sh);
            staffRepository.save(s);
            assigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "STAFF_BULK", null, null,
                    "Bulk-assigned " + assigned + " staff to SH " + sh.getStaffId());
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("assigned", assigned);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Assigned " + assigned + " staff to " + sh.getFullName(), data);
    }

    @PostMapping("/unassign-staff-from-sh")
    @Transactional
    public ApiResponse unassignStaffFromSH(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentOI(auth);
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");

        List<Long> mySHIds = staffRepository.findByOfficeInchargeId(me.getId()).stream()
                .filter(s -> s.getRole() == StaffRole.SECTION_HEAD)
                .map(Staff::getId)
                .toList();

        int unassigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getSectionHead() == null || !mySHIds.contains(s.getSectionHead().getId())) {
                skipped.add(staffId + " (not under your Section Heads)");
                continue;
            }
            s.setSectionHead(null);
            staffRepository.save(s);
            unassigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "STAFF_BULK", null, null,
                    "Bulk-unassigned " + unassigned + " staff from SHs");
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("unassigned", unassigned);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Unassigned " + unassigned + " staff", data);
    }

    @SuppressWarnings("unchecked")
    private List<String> extractIds(Map<String, Object> body) {
        Object v = body == null ? null : body.get("staffIds");
        if (!(v instanceof List)) return List.of();
        return ((List<Object>) v).stream()
                .filter(java.util.Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.toList());
    }
}