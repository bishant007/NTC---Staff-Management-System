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
@RequestMapping("/api/section-head/bulk")
public class SectionHeadBulkController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AuditLogService auditLogService;

    private Staff currentSH(Authentication auth) {
        if (auth == null || auth.getName() == null)
            throw new RuntimeException("Not authenticated");
        Staff s = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (s.getRole() != StaffRole.SECTION_HEAD && s.getRole() != StaffRole.STAFF)
            throw new RuntimeException("Only Section Heads can use this endpoint");
        return s;
    }

    /** List all ACTIVE STAFF with no Section Head assigned. */
    @GetMapping("/unassigned-staff")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getUnassignedStaff(Authentication auth) {
        currentSH(auth); // validates role
        return staffRepository.findAll().stream()
                .filter(s -> s.isActive())
                .filter(s -> s.getRole() == StaffRole.STAFF)
                .filter(s -> s.getSectionHead() == null)
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /** Bulk assign selected staff to the calling Section Head. */
    @PostMapping("/assign-staff")
    @Transactional
    public ApiResponse assignStaffToMe(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentSH(auth);
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");

        int assigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getRole() != StaffRole.STAFF) { skipped.add(staffId + " (not a STAFF role)"); continue; }
            if (!s.isActive()) { skipped.add(staffId + " (inactive)"); continue; }
            if (s.getSectionHead() != null) { skipped.add(staffId + " (already has a Section Head)"); continue; }
            s.setSectionHead(me);
            staffRepository.save(s);
            assigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "STAFF_BULK", null, null,
                    "Bulk-assigned " + assigned + " staff to self");
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("assigned", assigned);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Assigned " + assigned + " staff to you", data);
    }

    /** Bulk unassign selected staff from the calling Section Head (only those under them). */
    @PostMapping("/unassign-staff")
    @Transactional
    public ApiResponse unassignStaffFromMe(@RequestBody Map<String, Object> body, Authentication auth) {
        Staff me = currentSH(auth);
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");

        int unassigned = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            if (s.getSectionHead() == null || !s.getSectionHead().getId().equals(me.getId())) {
                skipped.add(staffId + " (not under you)");
                continue;
            }
            s.setSectionHead(null);
            staffRepository.save(s);
            unassigned++;
        }

        try {
            auditLogService.record(me.getUsername(), AuditAction.USER_UPDATED,
                    "STAFF_BULK", null, null,
                    "Bulk-unassigned " + unassigned + " staff from self");
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