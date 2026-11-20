import jsPDF from 'jspdf';
import { formatNepalDateTime, nowNepalString, formatSnapshotValue } from './date';

const parseSnapshot = (str) => {
  const out = {};
  if (!str) return out;
  str.split('\n').forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    out[line.substring(0, idx)] = line.substring(idx + 1);
  });
  return out;
};

const humanize = (key) => {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const downloadNoticePdf = (notice, sigImages = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  let y = 18;

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

  const meta = [
    ['Reference No.', notice.referenceNumber || '—'],
    ['Notice Type', notice.noticeType || '—'],
    ['Decision Date', formatNepalDateTime(notice.decisionDate)],
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

  const sections = [
    ['STAFF DETAILS', parseSnapshot(notice.staffSnapshot)],
    ['SECTION HEAD', parseSnapshot(notice.sectionHeadSnapshot)],
    ['OFFICE INCHARGE', parseSnapshot(notice.officeInchargeSnapshot)],
    ['LEAVE SUMMARY', parseSnapshot(notice.leaveSummary)],
  ];

  sections.forEach(([title, data]) => {
    const keys = Object.keys(data);
    if (keys.length === 0) return;
    if (y > 255) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 46, 111);
    doc.text(title, 15, y);
    y += 6;

    doc.setFontSize(10);
    keys.forEach((k) => {
      const v = formatSnapshotValue(data[k]);
      if (y > 265) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(humanize(k) + ':', 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(String(v || '—'), pw - 85);
      doc.text(lines, 65, y);
      y += 5 * lines.length + 1;
    });
    y += 3;
  });

  if (y > 245) { doc.addPage(); y = 20; }

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
  y += 5 * remarkLines.length + 10;

  if (y > 200) { doc.addPage(); y = 20; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 46, 111);
  doc.text('Signatures', 15, y);
  y += 8;

  const boxW = (pw - 40) / 3;
  const boxH = 34;
  const sigY = y;

  const sigs = [
    ['Applicant', sigImages.staff, notice.staffSignature, notice.staffName],
    ['Section Head', sigImages.sh, notice.sectionHeadSignature, notice.sectionHeadName],
    ['Office In-Charge', sigImages.oi, notice.officeInchargeSignature, notice.officeInchargeName],
  ];

  sigs.forEach(([label, imgData, typedName, fullName], i) => {
    const x = 15 + i * (boxW + 5);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(x, sigY, boxW, boxH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 2, sigY + 5);

    if (imgData) {
      try {
        doc.addImage(imgData, 'PNG', x + 3, sigY + 8, boxW - 6, 16, undefined, 'FAST');
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(11, 46, 111);
        doc.text(String(typedName || fullName || '—'), x + 3, sigY + 16);
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(11, 46, 111);
      const sigText = typedName || fullName || '—';
      const sigLines = doc.splitTextToSize(String(sigText), boxW - 4);
      doc.text(sigLines[0] || '—', x + 3, sigY + 16);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const nameText = fullName || typedName || '—';
    const nameLines = doc.splitTextToSize(nameText, boxW - 4);
    doc.text(nameLines[0] || '—', x + 3, sigY + boxH - 4);
  });

  y = sigY + boxH + 8;

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated ${nowNepalString()} · This is a system-generated document. Verify at the NTC Staff Portal.`,
    pw / 2, footerY, { align: 'center' }
  );

  const filename = `NTC-Notice-${(notice.referenceNumber || notice.id).toString().replace(/[\\/]/g, '-')}.pdf`;
  doc.save(filename);
};