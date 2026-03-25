export interface LinkedChild {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  class?: { id: string; name: string; level: number } | null;
  relationship?: string;
  isPrimaryContact?: boolean;
  approvalStatus?: string;
  linkedAt?: string;
}

export interface FeePayment {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  feeStructure: {
    name: string;
    amount: number;
    type: string;
    academicYear?: { name: string };
    term?: { name: string };
  };
}

export interface Attendance {
  id: string;
  date: string;
  status: string;
  remarks?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
}

export interface Result {
  id: string;
  score: number;
  percentage: number;
  status: string;
  exam: {
    id: string;
    title: string;
    subject: { name: string; code: string };
    term: { name: string; academic_years: { name: string } };
  };
}

export interface ReportCard {
  id: string;
  totalScore: number;
  average: number;
  grade: string;
  term: {
    name: string;
    academic_years: { name: string };
  };
}

export interface ParentData {
  parent: { firstName: string; lastName: string; email: string; phone?: string };
  children: LinkedChild[];
  results: Result[];
  reportCards: ReportCard[];
  fees: FeePayment[];
  attendances: Attendance[];
  announcements: Announcement[];
}

export const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (grade === 'C') return 'bg-yellow-100 text-yellow-700';
  if (grade === 'D') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

export const getAttendanceColor = (status: string): string => {
  if (status === 'PRESENT') return 'bg-green-100 text-green-700';
  if (status === 'ABSENT') return 'bg-red-100 text-red-700';
  if (status === 'LATE') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
};

export const getStatusColor = (status: string): string => {
  if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
  if (status === 'FAILED') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
};

export const calculateAttendanceStats = (attendances: Attendance[]) => {
  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent = attendances.filter(a => a.status === 'ABSENT').length;
  const late = attendances.filter(a => a.status === 'LATE').length;
  return { 
    present, 
    absent, 
    late, 
    total, 
    percentage: total > 0 ? Math.round((present / total) * 100) : 0 
  };
};

export const calculateFeeStats = (fees: FeePayment[]) => {
  const total = fees.reduce((sum, f) => sum + f.feeStructure.amount, 0);
  const paid = fees
    .filter(f => f.status === 'COMPLETED')
    .reduce((sum, f) => sum + f.amount, 0);
  const pending = total - paid;
  return { total, paid, pending };
};
