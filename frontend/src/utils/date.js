export const NEPAL_TZ = 'Asia/Kathmandu';
export const WORK_HOURS_START_HOUR = 6;
export const WORK_HOURS_END_HOUR   = 22;

const parse = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * "14 Oct 2026, 02:00 PM"
 * Date via en-GB (gives "14 Oct 2026").
 * Time via en-US (guarantees AM/PM — en-GB sometimes ignores hour12).
 */
export const formatNepalDateTime = (v) => {
  const d = parse(v);
  if (!d) return '—';
  const datePart = d.toLocaleDateString('en-GB', {
    timeZone: NEPAL_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    timeZone: NEPAL_TZ,
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  return `${datePart}, ${timePart}`;
};

/** "14 Oct 2026" */
export const formatNepalDate = (v) => {
  const d = parse(v);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    timeZone: NEPAL_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/** "02:00 PM" */
export const formatNepalTime = (v) => {
  const d = parse(v);
  if (!d) return '—';
  return d.toLocaleTimeString('en-US', {
    timeZone: NEPAL_TZ,
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/** For the PDF "Generated:" line. */
export const nowNepalString = () => formatNepalDateTime(new Date());

/** Short label for a "YYYY-MM-DD" filter value. */
export const formatNepalDayShort = (v) => {
  const d = parse(v);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    timeZone: NEPAL_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/** Convert a `datetime-local` input value into UTC ISO. */
export const nepalLocalInputToIso = (localStr) => {
  if (!localStr) return null;
  const withSeconds = localStr.length === 16 ? `${localStr}:00` : localStr;
  return new Date(`${withSeconds}+05:45`).toISOString();
};

/** Reverse: UTC ISO → `datetime-local` value in Nepal time. */
export const isoToNepalLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NEPAL_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

/** Earliest `datetime-local` value allowed as a leave start. */
export const earliestStartLocalInput = (bufferMinutes = 2) => {
  const now = new Date(Date.now() + bufferMinutes * 60 * 1000);
  return isoToNepalLocalInput(now.toISOString());
};

export const localInputHour = (localStr) => {
  if (!localStr || localStr.length < 13) return null;
  const h = parseInt(localStr.slice(11, 13), 10);
  return Number.isFinite(h) ? h : null;
};

export const localInputMinutes = (localStr) => {
  if (!localStr || localStr.length < 16) return null;
  const h = parseInt(localStr.slice(11, 13), 10);
  const m = parseInt(localStr.slice(14, 16), 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

export const isWithinWorkHours = (
  localStr,
  startHour = WORK_HOURS_START_HOUR,
  endHour = WORK_HOURS_END_HOUR,
) => {
  const mins = localInputMinutes(localStr);
  if (mins === null) return false;
  return mins >= startHour * 60 && mins <= endHour * 60;
};

export const workHoursLabel = (
  startHour = WORK_HOURS_START_HOUR,
  endHour = WORK_HOURS_END_HOUR,
) => {
  const fmt = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${suffix}`;
  };
  return `${fmt(startHour)} – ${fmt(endHour)}`;
};

/**
 * Smart formatter for values inside notice snapshots.
 *
 * Handles all historical snapshot formats:
 *   - ISO UTC "2026-10-12T14:00:00Z"   → "12 Oct 2026, 02:00 PM" (converted)
 *   - Legacy "2026-10-12 14:00"        → "12 Oct 2026, 02:00 PM" (converted)
 *   - Plain date "2026-10-12"          → unchanged
 *   - Everything else                  → unchanged
 */
export const formatSnapshotValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const s = String(value);

  // ISO UTC — "2026-10-12T14:00:00Z" (with optional ms / offset)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(s)) {
    return formatNepalDateTime(s);
  }

  // Legacy Nepal-local "YYYY-MM-DD HH:mm" — parse as Nepal time, reformat
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
    try {
      const iso = new Date(`${s.replace(' ', 'T')}:00+05:45`).toISOString();
      return formatNepalDateTime(iso);
    } catch {
      return s;
    }
  }

  // Plain date "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  return s;
};