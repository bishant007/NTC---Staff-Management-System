/**
 * Central mapping of leave types → labels, grouped by category.
 * Keep in sync with the backend `LeaveType` enum.
 */

export const PERSONAL_LEAVE_TYPES = [
  { value: 'FULL_DAY',       label: 'Full Day',        icon: '🗓️' },
  { value: 'HALF_DAY',       label: 'Half Day',        icon: '⏱️' },
  { value: 'AFTER_HOUR',     label: 'After Hour',      icon: '🌆' },
  { value: 'MULTI_DAY',      label: 'Multi Day',       icon: '📆' },
  { value: 'SICK',           label: 'Sick Leave',      icon: '🤒' },
  { value: 'CASUAL',         label: 'Casual Leave',    icon: '☕' },
  { value: 'EMERGENCY',      label: 'Emergency Leave', icon: '🚨' },
  { value: 'PERSONAL_OTHER', label: 'Other (specify below)', icon: '✍️' },
];

export const OFFICE_LEAVE_TYPES = [
  { value: 'FIELD_VISIT',      label: 'Field Visit',          icon: '🚗' },
  { value: 'OFFICIAL_MEETING', label: 'Official Meeting',     icon: '🤝' },
  { value: 'TRAINING',         label: 'Training / Workshop',  icon: '🎓' },
  { value: 'CLIENT_VISIT',     label: 'Client Visit',         icon: '👥' },
  { value: 'OFFICE_OTHER',     label: 'Other (specify below)', icon: '✍️' },
];

export const OTHER_VALUES = ['PERSONAL_OTHER', 'OFFICE_OTHER'];

export const leaveTypesFor = (category) =>
  category === 'OFFICE_WORK' ? OFFICE_LEAVE_TYPES : PERSONAL_LEAVE_TYPES;

const ALL = [...PERSONAL_LEAVE_TYPES, ...OFFICE_LEAVE_TYPES];
const LABEL_BY_VALUE = Object.fromEntries(ALL.map(t => [t.value, t.label]));

/** Display label for a leave type value. Falls back to a prettified version. */
export const leaveTypeLabel = (value) => {
  if (!value) return '—';
  return LABEL_BY_VALUE[value] || String(value).replace(/_/g, ' ');
};

/** True if the value represents an "Other (specify)" type. */
export const isOtherType = (value) => OTHER_VALUES.includes(value);