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
@RequestMapping("/api/admin/bulk")
public class AdminBulkController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AuditLogService auditLogService;

    /**
     * Flexible unassigned list for admin.
     * ?role=STAFF|SECTION_HEAD|OFFICE_INCHARGE (optional)
     * ?unassignedFrom=SH|OI|BOTH (optional; default = any null slot for that role)
     */
    @GetMapping("/unassigned")
    @Transactional(readOnly = true)
    public List<StaffResponseDTO> getUnassigned(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "unassignedFrom", required = false) String unassignedFrom) {

        StaffRole roleFilter = null;
        if (role != null && !role.isBlank()) {
            try { roleFilter = StaffRole.valueOf(role.trim().toUpperCase()); } catch (Exception ignored) {}
        }
        String from = unassignedFrom == null ? "" : unassignedFrom.trim().toUpperCase();

        final StaffRole finalRole = roleFilter;
        return staffRepository.findAll().stream()
                .filter(Staff::isActive)
                .filter(s -> finalRole == null || s.getRole() == finalRole)
                .filter(s -> {
                    if (from.isEmpty()) {
                        if (s.getRole() == StaffRole.STAFF) return s.getSectionHead() == null;
                        if (s.getRole() == StaffRole.SECTION_HEAD) return s.getOfficeIncharge() == null;
                        return false;
                    }
                    if ("SH".equals(from)) return s.getSectionHead() == null;
                    if ("OI".equals(from)) return s.getOfficeIncharge() == null;
                    if ("BOTH".equals(from)) return s.getSectionHead() == null && s.getOfficeIncharge() == null;
                    return true;
                })
                .map(StaffResponseDTO::from)
                .collect(Collectors.toList());
    }

    /** Bulk assign: { staffIds, sectionHeadId?, officeInchargeId? } */
    @PostMapping("/assign")
    @Transactional
    public ApiResponse bulkAssign(@RequestBody Map<String, Object> body, Authentication auth) {
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");

        String shId = body.get("sectionHeadId") == null ? null : String.valueOf(body.get("sectionHeadId")).trim();
        String oiId = body.get("officeInchargeId") == null ? null : String.valueOf(body.get("officeInchargeId")).trim();
        if ((shId == null || shId.isEmpty()) && (oiId == null || oiId.isEmpty()))
            return new ApiResponse(false, "Pick at least one target (Section Head or Office In-Charge)");

        Staff sh = (shId != null && !shId.isEmpty())
                ? staffRepository.findByStaffId(shId).orElse(null) : null;
        if (shId != null && !shId.isEmpty() && (sh == null || sh.getRole() != StaffRole.SECTION_HEAD))
            return new ApiResponse(false, "Section Head target invalid");
        Staff oi = (oiId != null && !oiId.isEmpty())
                ? staffRepository.findByStaffId(oiId).orElse(null) : null;
        if (oiId != null && !oiId.isEmpty() && (oi == null || oi.getRole() != StaffRole.OFFICE_INCHARGE))
            return new ApiResponse(false, "Office In-Charge target invalid");

        int updated = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            boolean changed = false;
            if (sh != null) { s.setSectionHead(sh); changed = true; }
            if (oi != null) { s.setOfficeIncharge(oi); changed = true; }
            if (!changed) { skipped.add(staffId + " (no change)"); continue; }
            staffRepository.save(s);
            updated++;
        }

        try {
            auditLogService.record(auth == null ? null : auth.getName(),
                    AuditAction.USER_UPDATED, "STAFF_BULK", null, null,
                    "Admin bulk-assigned " + updated + " staff"
                            + (sh != null ? " to SH " + sh.getStaffId() : "")
                            + (oi != null ? " to OI " + oi.getStaffId() : ""));
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("updated", updated);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Updated " + updated + " staff", data);
    }

    /** Bulk unassign: { staffIds, clearSectionHead?: true, clearOfficeIncharge?: true } */
    @PostMapping("/unassign")
    @Transactional
    public ApiResponse bulkUnassign(@RequestBody Map<String, Object> body, Authentication auth) {
        List<String> ids = extractIds(body);
        if (ids.isEmpty()) return new ApiResponse(false, "No staff selected");

        boolean clearSH = Boolean.TRUE.equals(body.get("clearSectionHead"));
        boolean clearOI = Boolean.TRUE.equals(body.get("clearOfficeIncharge"));
        if (!clearSH && !clearOI)
            return new ApiResponse(false, "Pick at least one field to clear");

        int updated = 0;
        List<String> skipped = new ArrayList<>();
        for (String staffId : ids) {
            Staff s = staffRepository.findByStaffId(staffId).orElse(null);
            if (s == null) { skipped.add(staffId + " (not found)"); continue; }
            boolean changed = false;
            if (clearSH && s.getSectionHead() != null) { s.setSectionHead(null); changed = true; }
            if (clearOI && s.getOfficeIncharge() != null) { s.setOfficeIncharge(null); changed = true; }
            if (!changed) { skipped.add(staffId + " (no change)"); continue; }
            staffRepository.save(s);
            updated++;
        }

        try {
            auditLogService.record(auth == null ? null : auth.getName(),
                    AuditAction.USER_UPDATED, "STAFF_BULK", null, null,
                    "Admin bulk-unassigned " + updated + " staff"
                            + (clearSH ? " [SH cleared]" : "")
                            + (clearOI ? " [OI cleared]" : ""));
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("updated", updated);
        data.put("skipped", skipped);
        return new ApiResponse(true, "Updated " + updated + " staff", data);
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