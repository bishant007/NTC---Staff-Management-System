import jsPDF from 'jspdf';

const header = (doc, title, subtitle, pw) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(11, 46, 111);
  doc.text('NEPAL TELECOM', pw / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(91, 123, 171);
  doc.text(title, pw / 2, 23, { align: 'center' });

  doc.setDrawColor(11, 46, 111);
  doc.setLineWidth(0.5);
  doc.line(14, 27, pw - 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 33);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pw - 14, 33, { align: 'right' });
};

const footer = (doc, pw) => {
  const ph = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('NTC Staff System · Report', pw / 2, ph - 8, { align: 'center' });
};

const drawTable = (doc, startY, columns, rows, pw) => {
  const marginX = 14;
  const usableW = pw - marginX * 2;
  let y = startY;
  const rowH = 7;

  // Column widths proportional to header length (simple heuristic)
  const totalWeight = columns.reduce((a, c) => a + c.weight, 0);
  const colXs = [];
  let x = marginX;
  columns.forEach(c => {
    const w = (c.weight / totalWeight) * usableW;
    colXs.push({ x, w, label: c.label });
    x += w;
  });

  // Header row
  doc.setFillColor(240, 245, 255);
  doc.rect(marginX, y, usableW, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  colXs.forEach(col => doc.text(col.label, col.x + 1, y + 5));
  y += rowH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  rows.forEach((row, idx) => {
    if (y + rowH > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, usableW, rowH, 'F');
    }
    row.forEach((cell, i) => {
      const text = String(cell ?? '—');
      const maxChars = Math.floor(colXs[i].w / 1.7);
      const display = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      doc.text(display, colXs[i].x + 1, y + 5);
    });
    y += rowH;
  });

  return y;
};

export const downloadUserDirectoryPdf = (users) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pw = doc.internal.pageSize.getWidth();

  header(doc, 'User Directory', `Total Users: ${users.length}`, pw);

  const columns = [
    { label: 'Staff ID',  weight: 1.4 },
    { label: 'Full Name', weight: 2   },
    { label: 'Email',     weight: 2.4 },
    { label: 'Role',      weight: 1.4 },
    { label: 'Department',weight: 1.6 },
    { label: 'Branch',    weight: 1.4 },
    { label: 'Section Head',   weight: 1.8 },
    { label: 'Office In-Charge', weight: 1.8 },
  ];

  const rows = users.map(u => [
    u.staffId,
    u.fullName,
    u.email,
    u.role?.replace('_', ' '),
    u.department,
    u.branch,
    u.sectionHeadName || '—',
    u.officeInchargeName || '—',
  ]);

  drawTable(doc, 38, columns, rows, pw);
  footer(doc, pw);
  doc.save(`NTC-User-Directory-${Date.now()}.pdf`);
};

export const downloadLeaveLedgerPdf = (requests) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pw = doc.internal.pageSize.getWidth();

  header(doc, 'Leave Ledger', `Total Requests: ${requests.length}`, pw);

  const columns = [
    { label: 'Ref No.',   weight: 2.2 },
    { label: 'Staff',     weight: 2   },
    { label: 'Type',      weight: 1.4 },
    { label: 'Start',     weight: 1.8 },
    { label: 'Return',    weight: 1.8 },
    { label: 'Section Head',   weight: 2 },
    { label: 'Office In-Charge', weight: 2 },
    { label: 'Status',    weight: 1.6 },
  ];

  const rows = requests.map(r => [
    r.referenceNumber || `LR-${r.id}`,
    r.staffName,
    r.leaveType?.replace(/_/g, ' '),
    r.leaveStartTime ? new Date(r.leaveStartTime).toLocaleDateString() : '—',
    r.returnDateTime ? new Date(r.returnDateTime).toLocaleDateString() : '—',
    r.sectionHeadName || '—',
    r.officeInchargeName || '—',
    r.status?.replace(/_/g, ' '),
  ]);

  drawTable(doc, 38, columns, rows, pw);
  footer(doc, pw);
  doc.save(`NTC-Leave-Ledger-${Date.now()}.pdf`);
};

export const downloadApprovalTimelinePdf = (notices) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();

  header(doc, 'Approval Timeline', `Total Notices: ${notices.length}`, pw);

  const columns = [
    { label: 'Ref No.',   weight: 2.6 },
    { label: 'Type',      weight: 1.6 },
    { label: 'Decision By', weight: 2.2 },
    { label: 'Date',      weight: 3 },
  ];

  const rows = notices.map(n => [
    n.referenceNumber,
    n.noticeType,
    n.finalDecisionByRole,
    n.decisionDate ? new Date(n.decisionDate).toLocaleString() : '—',
  ]);

  drawTable(doc, 38, columns, rows, pw);
  footer(doc, pw);
  doc.save(`NTC-Approval-Timeline-${Date.now()}.pdf`);
};