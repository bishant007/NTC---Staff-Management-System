import jsPDF from 'jspdf';
import { formatNepalDateTime, nowNepalString } from './date';
import { leaveTypeLabel } from './leaveTypes';

const NAVY    = [11, 46, 111];
const BLUE    = [13, 110, 253];
const LIGHT   = [244, 248, 255];
const BORDER  = [203, 213, 225];
const TEXT    = [15, 23, 42];
const MUTED   = [100, 116, 139];
const SUCCESS = [22, 163, 74];
const DANGER  = [220, 38, 38];
const WARNING = [245, 158, 11];
const NEUTRAL = [100, 116, 139];
const PURPLE  = [124, 58, 237];
const PINK    = [157, 23, 77];

const drawReportHeader = (doc, { title, subtitle, filters }) => {
  const pw = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 22, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 22, pw, 1.2, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 4.5, 13, 13, 2, 2, 'F');
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('NTC', 16.5, 12.5, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('NEPAL TELECOM', 27, 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 215, 240);
  doc.text('Staff Leave Management System', 27, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), pw - 10, 10.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 215, 240);
  doc.text(`Generated: ${nowNepalString()}`, pw - 10, 16, { align: 'right' });

  let y = 30;

  if (subtitle) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(subtitle, 10, y);
    y += 4.5;
  }

  if (filters && filters.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text('Filters: ' + filters.join('   •   '), 10, y);
    y += 5;
  }

  return y;
};

const drawStatCards = (doc, stats, startY) => {
  const pw = doc.internal.pageSize.getWidth();
  const marginX = 10;
  const gap = 3;
  const n = stats.length;
  const cardW = (pw - marginX * 2 - gap * (n - 1)) / n;
  const cardH = 13;
  let x = marginX;

  stats.forEach(({ label, value, color }) => {
    const c = color || NAVY;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, 'F');
    doc.setFillColor(...c);
    doc.rect(x, startY, 1.2, cardH, 'F');

    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(String(label).toUpperCase(), x + 3.5, startY + 4);

    doc.setTextColor(...c);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(String(value ?? 0), x + 3.5, startY + 10.5);

    x += cardW + gap;
  });

  return startY + cardH + 5;
};

const drawTable = (doc, startY, columns, rows, options = {}) => {
  const pw = doc.internal.pageSize.getWidth();
  const marginX = 10;
  const usableW = pw - marginX * 2;
  const rowH = options.rowH || 6.5;
  const headerH = options.headerH || 7;
  const fontSize = options.fontSize || 7;
  const pageH = doc.internal.pageSize.getHeight();

  const totalWeight = columns.reduce((a, c) => a + c.weight, 0);
  const colXs = [];
  let x = marginX;
  columns.forEach(c => {
    const w = (c.weight / totalWeight) * usableW;
    colXs.push({ x, w, label: c.label, align: c.align || 'left' });
    x += w;
  });

  let y = startY;

  const drawHeaderRow = () => {
    doc.setFillColor(...NAVY);
    doc.rect(marginX, y, usableW, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(255, 255, 255);
    colXs.forEach(col => {
      const tx = col.align === 'right' ? col.x + col.w - 1.5 : col.x + 1.5;
      doc.text(col.label, tx, y + headerH - 2, { align: col.align });
    });
    y += headerH;
  };

  drawHeaderRow();

  rows.forEach((row, idx) => {
    if (y + rowH > pageH - 12) {
      doc.addPage();
      y = 15;
      drawHeaderRow();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, usableW, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...TEXT);

    row.forEach((cell, i) => {
      const text = String(cell ?? '—');
      const maxChars = Math.max(3, Math.floor(colXs[i].w / (fontSize * 0.22)));
      const display = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      const tx = colXs[i].align === 'right'
        ? colXs[i].x + colXs[i].w - 1.5
        : colXs[i].x + 1.5;
      doc.text(display, tx, y + rowH - 1.8, { align: colXs[i].align });
    });

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.08);
    doc.line(marginX, y + rowH, marginX + usableW, y + rowH);

    y += rowH;
  });

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.rect(marginX, startY - 0.4, usableW, y - startY + 0.4);

  return y;
};

const drawFooters = (doc) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(10, ph - 8, pw - 10, ph - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text('NTC Staff Leave Management · System-generated report · Not valid without official seal',
      10, ph - 4);
    doc.text(`Page ${i} of ${totalPages}`, pw - 10, ph - 4, { align: 'right' });
  }
};

const durationLabel = (startIso, endIso) => {
  if (!startIso || !endIso) return '—';
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return '—';
  const hours = (e - s) / (1000 * 60 * 60);
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const prettyStatus = (s) => (s ? String(s).replace(/_/g, ' ') : '—');
const prettyRole   = (r) => (r ? String(r).replace(/_/g, ' ') : '—');
const prettyCategory = (c) => (c === 'OFFICE_WORK' ? 'Office Work' : 'Personal');

const typeCell = (r) => {
  const label = r.leaveTypeLabel || leaveTypeLabel(r.leaveType);
  if (r.customLeaveType) return `${label} — ${r.customLeaveType}`;
  return label;
};

export const downloadUserDirectoryPdf = (users = [], options = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

  const total    = users.length;
  const staff    = users.filter(u => u.role === 'STAFF').length;
  const sh       = users.filter(u => u.role === 'SECTION_HEAD').length;
  const oi       = users.filter(u => u.role === 'OFFICE_INCHARGE').length;
  const active   = users.filter(u => u.active !== false).length;
  const inactive = total - active;

  const filters = [];
  if (options.roleFilter) filters.push(`Role: ${prettyRole(options.roleFilter)}`);
  if (options.deptFilter) filters.push(`Department: ${options.deptFilter}`);

  let y = drawReportHeader(doc, {
    title: 'User Directory',
    subtitle: 'Complete listing of all accounts registered in the NTC Leave Management System',
    filters,
  });

  y = drawStatCards(doc, [
    { label: 'Total Users',      value: total,    color: NAVY },
    { label: 'Staff',            value: staff,    color: BLUE },
    { label: 'Section Heads',    value: sh,       color: PURPLE },
    { label: 'Office In-Charge', value: oi,       color: PINK },
    { label: 'Active',           value: active,   color: SUCCESS },
    { label: 'Inactive',         value: inactive, color: inactive > 0 ? DANGER : NEUTRAL },
  ], y);

  const columns = [
    { label: 'Staff ID',          weight: 1.2 },
    { label: 'Full Name',         weight: 1.8 },
    { label: 'Email',             weight: 2.2 },
    { label: 'Phone',             weight: 1.3 },
    { label: 'Role',              weight: 1.2 },
    { label: 'Department',        weight: 1.3 },
    { label: 'Branch',            weight: 1.1 },
    { label: 'Section Head',      weight: 1.6 },
    { label: 'Office In-Charge',  weight: 1.6 },
    { label: 'Status',            weight: 0.9 },
  ];

  const rows = users.map(u => [
    u.staffId || '—',
    u.fullName || '—',
    u.email || '—',
    u.phone || '—',
    prettyRole(u.role),
    u.department || '—',
    u.branch || '—',
    u.sectionHeadName || '—',
    u.officeInchargeName || '—',
    u.active === false ? 'Inactive' : 'Active',
  ]);

  drawTable(doc, y + 2, columns, rows, { fontSize: 6.8, rowH: 6.2 });
  drawFooters(doc);
  doc.save(`NTC-User-Directory-${Date.now()}.pdf`);
};

export const downloadLeaveLedgerPdf = (requests = [], options = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

  const total     = requests.length;
  const approved  = requests.filter(r => r.status === 'APPROVED').length;
  const pending   = requests.filter(r => String(r.status || '').startsWith('PENDING')).length;
  const onHold    = requests.filter(r => r.status === 'ON_HOLD').length;
  const rejected  = requests.filter(r => r.status === 'REJECTED').length;
  const cancelled = requests.filter(r => r.status === 'CANCELLED').length;

  const filters = [];
  if (options.statusFilter)   filters.push(`Status: ${prettyStatus(options.statusFilter)}`);
  if (options.categoryFilter) filters.push(`Category: ${prettyCategory(options.categoryFilter)}`);
  if (options.dateFrom)       filters.push(`From: ${options.dateFrom}`);
  if (options.dateTo)         filters.push(`To: ${options.dateTo}`);
  if (options.search)         filters.push(`Search: "${options.search}"`);

  let y = drawReportHeader(doc, {
    title: 'Leave Ledger',
    subtitle: 'Complete record of all leave requests submitted in the system',
    filters,
  });

  y = drawStatCards(doc, [
    { label: 'Total',     value: total,     color: NAVY },
    { label: 'Approved',  value: approved,  color: SUCCESS },
    { label: 'Pending',   value: pending,   color: WARNING },
    { label: 'On Hold',   value: onHold,    color: [180, 83, 9] },
    { label: 'Rejected',  value: rejected,  color: DANGER },
    { label: 'Cancelled', value: cancelled, color: NEUTRAL },
  ], y);

  const sorted = [...requests].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const columns = [
    { label: 'Ref No.',          weight: 1.9 },
    { label: 'Staff',            weight: 1.6 },
    { label: 'Category',         weight: 1.1 },
    { label: 'Type',             weight: 2.2 },
    { label: 'From',             weight: 1.7 },
    { label: 'Until',            weight: 1.7 },
    { label: 'Dur',              weight: 0.8, align: 'right' },
    { label: 'Section Head',     weight: 1.4 },
    { label: 'Office In-Charge', weight: 1.4 },
    { label: 'Status',           weight: 1.2 },
  ];

  const rows = sorted.map(r => [
    r.referenceNumber || `LR-${r.id}`,
    r.staffName || '—',
    prettyCategory(r.category),
    typeCell(r),
    formatNepalDateTime(r.leaveStartTime),
    formatNepalDateTime(r.returnDateTime),
    durationLabel(r.leaveStartTime, r.returnDateTime),
    r.sectionHeadName || '—',
    r.officeInchargeName || '—',
    prettyStatus(r.status),
  ]);

  drawTable(doc, y + 2, columns, rows, { fontSize: 6.2, rowH: 6.2 });
  drawFooters(doc);
  doc.save(`NTC-Leave-Ledger-${Date.now()}.pdf`);
};

export const downloadApprovalTimelinePdf = (notices = [], options = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const total      = notices.length;
  const approvals  = notices.filter(n => n.noticeType === 'APPROVAL').length;
  const rejections = notices.filter(n => n.noticeType === 'REJECTION').length;

  const filters = [];
  if (options.typeFilter) filters.push(`Type: ${options.typeFilter}`);

  let y = drawReportHeader(doc, {
    title: 'Approval Timeline',
    subtitle: 'Chronological log of every approval and rejection decision recorded in the system',
    filters,
  });

  y = drawStatCards(doc, [
    { label: 'Total Notices', value: total,      color: NAVY },
    { label: 'Approvals',     value: approvals,  color: SUCCESS },
    { label: 'Rejections',    value: rejections, color: DANGER },
  ], y);

  const sorted = [...notices].sort((a, b) =>
    new Date(b.decisionDate || b.createdAt || 0) - new Date(a.decisionDate || a.createdAt || 0));

  const columns = [
    { label: 'Ref No.',       weight: 2.1 },
    { label: 'Decision',      weight: 1.4 },
    { label: 'Decision By',   weight: 2.0 },
    { label: 'Date',          weight: 2.6 },
    { label: 'Remarks',       weight: 3.2 },
  ];

  const rows = sorted.map(n => [
    n.referenceNumber || '—',
    prettyStatus(n.noticeType),
    prettyStatus(n.finalDecisionByRole),
    formatNepalDateTime(n.decisionDate || n.createdAt),
    n.decisionRemarks || '—',
  ]);

  drawTable(doc, y + 2, columns, rows, { fontSize: 7, rowH: 7 });
  drawFooters(doc);
  doc.save(`NTC-Approval-Timeline-${Date.now()}.pdf`);
};