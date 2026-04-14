import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  label: string;
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
  title?: string
): void {
  const doc = new jsPDF();

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  const headers = columns.map(col => col.label);
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      return String(value);
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 30 : 14,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [26, 86, 219],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

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