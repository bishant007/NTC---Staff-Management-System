import jsPDF from 'jspdf';

/** Parse "key=value\nkey2=value2" into an object. */
const parseSnapshot = (str) => {
  const out = {};
  if (!str) return out;
  str.split('\n').forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const k = line.substring(0, idx);
    const v = line.substring(idx + 1);
    out[k] = v;
  });
  return out;
};

const humanize = (key) => {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Generate and download the PDF for a NoticeDTO object.
 * NoticeDTO fields used:
 *  referenceNumber, noticeType, decisionDate, finalDecisionByRole,
 *  staffSnapshot, sectionHeadSnapshot, officeInchargeSnapshot, leaveSummary,
 *  decisionRemarks, staffSignature, sectionHeadSignature, officeInchargeSignature
 */
export const downloadNoticePdf = (notice) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  let y = 18;

  // ---------- Header ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(11, 46, 111);
  doc.text('NEPAL TELECOM', pw / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(91, 123, 171);
  doc.text('Leave Approval Notice', pw / 2, y, { align: 'center' });
  y += 10;

  // ---------- Meta ----------
  const meta = [
    ['Reference No.', notice.referenceNumber || '—'],
    ['Notice Type', notice.noticeType || '—'],
    ['Decision Date', notice.decisionDate ? new Date(notice.decisionDate).toLocaleString() : '—'],
    ['Final Decision By', notice.finalDecisionByRole || '—'],
  ];

  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(k + ':', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(String(v), 65, y);
    y += 6;
  });

  y += 4;

  // ---------- Sections ----------
  const sections = [
    ['STAFF DETAILS', parseSnapshot(notice.staffSnapshot)],
    ['SECTION HEAD', parseSnapshot(notice.sectionHeadSnapshot)],
    ['OFFICE INCHARGE', parseSnapshot(notice.officeInchargeSnapshot)],
    ['LEAVE SUMMARY', parseSnapshot(notice.leaveSummary)],
  ];

  sections.forEach(([title, data]) => {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 46, 111);
    doc.text(title, 15, y);
    y += 6;

    doc.setFontSize(10);
    keys.forEach((k) => {
      const v = data[k];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(humanize(k) + ':', 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(String(v || '—'), pw - 85);
      doc.text(lines, 65, y);
      y += 5 * lines.length + 1;

      if (y > 265) { doc.addPage(); y = 20; }
    });
    y += 3;
  });

  // ---------- Remarks ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 46, 111);
  doc.text('Decision Remarks', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const remarks = notice.decisionRemarks || '—';
  const remarkLines = doc.splitTextToSize(remarks, pw - 30);
  doc.text(remarkLines, 15, y);
  y += 5 * remarkLines.length + 8;

  // ---------- Signatures ----------
  if (y > 240) { doc.addPage(); y = 20; }

  const boxW = (pw - 40) / 3;
  const sigY = y;
  const sigs = [
    ['Staff', notice.staffSignature],
    ['Section Head', notice.sectionHeadSignature],
    ['Office Incharge', notice.officeInchargeSignature],
  ];

  sigs.forEach(([label, sig], i) => {
    const x = 15 + i * (boxW + 5);
    doc.setDrawColor(219, 231, 247);
    doc.setLineWidth(0.4);
    doc.rect(x, sigY, boxW, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(label + ' Signature', x + 2, sigY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(11, 46, 111);
    const sigText = sig || '—';
    const sigLines = doc.splitTextToSize(String(sigText), boxW - 4);
    doc.text(sigLines[0] || '—', x + 2, sigY + 14);
  });

  // ---------- Footer ----------
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a system-generated document. Verify at the NTC Staff Portal.',
    pw / 2, footerY, { align: 'center' });

  // ---------- Save ----------
  const filename = `NTC-Notice-${(notice.referenceNumber || notice.id).toString().replace(/[\\/]/g, '-')}.pdf`;
  doc.save(filename);
};