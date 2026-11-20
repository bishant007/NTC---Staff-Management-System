package com.ntc.backend.enums;

/**
 * All leave / absence types, grouped by category.
 *
 *  - PERSONAL types consume from personal leave balances.
 *  - OFFICE_WORK types are duty-based and do NOT consume personal balances.
 *  - "OTHER" types require a custom text description from the user.
 *
 * Whenever a new type is added, update:
 *   - isOfficeWork() / requiresCustomText() below
 *   - LeaveBalanceService.defaultEntitlement()
 *   - frontend/src/utils/leaveTypes.js
 */
public enum LeaveType {

    // ===== PERSONAL =====
    FULL_DAY,
    HALF_DAY,
    AFTER_HOUR,
    MULTI_DAY,
    SICK,
    CASUAL,
    EMERGENCY,
    PERSONAL_OTHER,

    // ===== OFFICE WORK =====
    FIELD_VISIT,
    OFFICIAL_MEETING,
    TRAINING,
    CLIENT_VISIT,
    OFFICE_OTHER;

    /** True for types that belong to the OFFICE_WORK category. */
    public boolean isOfficeWork() {
        return switch (this) {
            case FIELD_VISIT, OFFICIAL_MEETING, TRAINING, CLIENT_VISIT, OFFICE_OTHER -> true;
            default -> false;
        };
    }

    /** True for types that belong to the PERSONAL category. */
    public boolean isPersonal() {
        return !isOfficeWork();
    }

    /** True for "Other (specify…)" types that need a custom text description. */
    public boolean requiresCustomText() {
        return this == PERSONAL_OTHER || this == OFFICE_OTHER;
    }

    /** Human-friendly label used in the UI and PDFs. */
    public String prettyLabel() {
        return switch (this) {
            case FULL_DAY         -> "Full Day";
            case HALF_DAY         -> "Half Day";
            case AFTER_HOUR       -> "After Hour";
            case MULTI_DAY        -> "Multi Day";
            case SICK             -> "Sick";
            case CASUAL           -> "Casual";
            case EMERGENCY        -> "Emergency";
            case PERSONAL_OTHER   -> "Other (Personal)";
            case FIELD_VISIT      -> "Field Visit";
            case OFFICIAL_MEETING -> "Official Meeting";
            case TRAINING         -> "Training";
            case CLIENT_VISIT     -> "Client Visit";
            case OFFICE_OTHER     -> "Other (Office Work)";
        };
    }
}