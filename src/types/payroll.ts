export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
  salary?: number;
}

export interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  totalEarnings: number;
  pensionDeduction: number;
  taxDeduction: number;
  nhfDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  paymentDate?: string;
  paymentReference?: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface PayrollFormData {
  teacherId: string;
  month: number;
  year: number;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  pensionRate: string;
  taxRate: string;
  nhfRate: string;
  otherDeductions: string;
}

export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getInitialFormData = (): PayrollFormData => ({
  teacherId: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  basicSalary: '',
  housingAllowance: '10000',
  transportAllowance: '5000',
  otherAllowances: '0',
  pensionRate: '8',
  taxRate: '20',
  nhfRate: '2.5',
  otherDeductions: '0',
});

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getMonthName = (month: number): string => {
  return months[month - 1] || '';
};
