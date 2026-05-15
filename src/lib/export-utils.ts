import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  label: string;
}

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  schoolName?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  includeTimestamp?: boolean;
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row =>
      columns.reduce((acc, col) => {
        acc[col.label] = row[col.key] !== undefined && row[col.key] !== null
          ? String(row[col.key])
          : '';
        return acc;
      }, {} as Record<string, string>)
    )
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const colWidths = columns.map(col => ({
    wch: Math.max(col.label.length, 20)
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  options: PDFExportOptions = {}
): void {
  const { title, subtitle, schoolName, orientation = 'portrait', includeTimestamp = true } = options;
  
  const doc = new jsPDF({ orientation });
  
  let yPos = 14;

  if (schoolName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, 14, yPos);
    yPos += 8;
  }

  if (title) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, yPos);
    yPos += 6;
  }

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, yPos);
    yPos += 6;
  }

  if (includeTimestamp) {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 4;
  }

  const headers = columns.map(col => col.label);
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') return value.toLocaleString();
      return String(value);
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPos + 4,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Page 1 of 1', pageWidth - 30, doc.internal.pageSize.getHeight() - 5);

  doc.save(`${filename}.pdf`);
}

export function formatStudentForExport(student: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  className?: string | null;
}): Record<string, string> {
  return {
    Name: `${student.firstName} ${student.lastName}`,
    Email: student.email || '',
    Phone: student.phone || '',
    Class: student.className || '',
    Status: student.status || 'ACTIVE',
  };
}

export function formatTeacherForExport(teacher: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  specialty?: string | null;
}): Record<string, string> {
  return {
    Name: `${teacher.firstName} ${teacher.lastName}`,
    Email: teacher.email || '',
    Phone: teacher.phone || '',
    Specialty: teacher.specialty || '',
    Status: teacher.status || 'ACTIVE',
  };
}

export function formatStaffForExport(staff: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
}): Record<string, string> {
  return {
    Name: `${staff.firstName} ${staff.lastName}`,
    Email: staff.email || '',
    Phone: staff.phone || '',
    Role: staff.role || '',
    Status: staff.status || 'ACTIVE',
  };
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(num);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatStatus(status: string | null | undefined): string {
  if (!status) return '-';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatFeeComponentExport(component: {
  name: string;
  type: string;
  amount: number;
  tier?: { name: string } | null;
  isOptional: boolean;
}): Record<string, string> {
  return {
    Name: component.name,
    Type: component.type,
    Amount: formatCurrency(component.amount),
    Tier: component.tier?.name || 'All Tiers',
    Category: component.isOptional ? 'Optional' : 'Mandatory',
  };
}

export function formatFeeBillExport(bill: {
  student?: { firstName: string; lastName: string; studentId: string };
  academicYear?: { name: string };
  term?: { name: string };
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  createdAt: string;
}): Record<string, string> {
  return {
    'Student Name': `${bill.student?.firstName || ''} ${bill.student?.lastName || ''}`.trim(),
    'Student ID': bill.student?.studentId || '-',
    'Academic Year': bill.academicYear?.name || '-',
    Term: bill.term?.name || '-',
    'Total Amount': formatCurrency(bill.totalAmount),
    'Amount Paid': formatCurrency(bill.amountPaid),
    Balance: formatCurrency(bill.balance),
    Status: formatStatus(bill.status),
    'Generated Date': formatDate(bill.createdAt),
  };
}

export function formatFeePaymentExport(payment: {
  student?: { firstName: string; lastName: string; studentId: string };
  amount: number;
  method: string;
  status: string;
  paidAt: string | Date | null;
  transactionId?: string | null;
  referenceNo?: string;
}): Record<string, string> {
  return {
    'Student Name': `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`.trim(),
    'Student ID': payment.student?.studentId || '-',
    Amount: formatCurrency(payment.amount),
    Method: formatStatus(payment.method),
    Status: formatStatus(payment.status),
    'Payment Date': formatDate(payment.paidAt),
    'Transaction ID': payment.transactionId || payment.referenceNo || '-',
  };
}

export function formatFeeReceiptExport(receipt: {
  receiptNo: string;
  student?: { firstName: string; lastName: string; studentId: string };
  totalPaid: number;
  paymentBreakdown?: Array<{ componentName: string; amountPaid: number }>;
  generatedAt: string | Date;
}): Record<string, string> {
  const breakdown = receipt.paymentBreakdown
    ?.map(p => `${p.componentName}: ${formatCurrency(p.amountPaid)}`)
    .join('; ') || '-';
  
  return {
    'Receipt No': receipt.receiptNo,
    'Student Name': `${receipt.student?.firstName || ''} ${receipt.student?.lastName || ''}`.trim(),
    'Student ID': receipt.student?.studentId || '-',
    'Total Paid': formatCurrency(receipt.totalPaid),
    'Items': breakdown,
    'Date': formatDateTime(receipt.generatedAt),
  };
}