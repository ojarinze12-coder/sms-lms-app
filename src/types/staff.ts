export interface Staff {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  category: string;
  phone: string;
  gender: string;
  address: string;
  department: string;
  position: string;
  employmentType: string;
  status: string;
  joinDate: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StaffFormData {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  category: string;
  phone: string;
  gender: string;
  address: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  dateOfBirth: string;
  qualification: string;
  experience: string;
  joinDate: string;
  salary: string;
  employmentType: string;
  department: string;
  position: string;
  pensionPin: string;
  nhfNumber: string;
  bvn: string;
  nin: string;
  payeTin: string;
  bankName: string;
  bankAccount: string;
  bankSortCode: string;
  branchId: string;
}

export const staffCategories = [
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'BURSAR', label: 'Bursar/Finance' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'COOK', label: 'Cook' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'IT_SUPPORT', label: 'IT Support' },
  { value: 'COUNSELOR', label: 'Counselor' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'OTHER', label: 'Other' },
];

export const employmentTypes = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CASUAL', label: 'Casual' },
];

export const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

export const banks = [
  'Access Bank', 'EcoBank', 'Fidelity Bank', 'First Bank', 'FCMB', 'GTBank',
  'Heritage Bank', 'Keystone Bank', 'Polaris Bank', 'Stanbic IBTC', 'Sterling Bank',
  'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank'
];

export const categoryLabels: Record<string, string> = {
  ADMINISTRATIVE: 'Administrative',
  BURSAR: 'Bursar',
  LIBRARIAN: 'Librarian',
  SECURITY: 'Security',
  CLEANER: 'Cleaner',
  DRIVER: 'Driver',
  COOK: 'Cook',
  MAINTENANCE: 'Maintenance',
  IT_SUPPORT: 'IT Support',
  COUNSELOR: 'Counselor',
  NURSE: 'Nurse',
  OTHER: 'Other',
};

export const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700',
  TERMINATED: 'bg-red-100 text-red-700',
};

export const getInitialFormData = (): StaffFormData => ({
  employeeId: '',
  email: '',
  firstName: '',
  lastName: '',
  category: 'OTHER',
  phone: '',
  gender: '',
  address: '',
  stateOfOrigin: '',
  lgaOfOrigin: '',
  dateOfBirth: '',
  qualification: '',
  experience: '',
  joinDate: '',
  salary: '',
  employmentType: 'FULL_TIME',
  department: '',
  position: '',
  pensionPin: '',
  nhfNumber: '',
  bvn: '',
  nin: '',
  payeTin: '',
  bankName: '',
  bankAccount: '',
  bankSortCode: '',
  branchId: '',
});

export interface StaffConfig {
  teacherPositions: string[];
  staffCategories: string[];
  staffDepartments: string[];
  staffPositions: string[];
}

export const defaultTeacherPositions = [
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'HOD',
  'SENIOR_TEACHER',
  'CLASS_TEACHER',
  'FORM_MASTER',
  'SUBJECT_TEACHER',
  'ASSISTANT_TEACHER'
];

export const defaultStaffCategories = [
  'ADMINISTRATIVE',
  'BURSAR',
  'LIBRARIAN',
  'SECURITY',
  'CLEANER',
  'DRIVER',
  'COOK',
  'MAINTENANCE',
  'IT_SUPPORT',
  'COUNSELOR',
  'NURSE',
  'TRANSPORT'
];

export const defaultStaffDepartments = [
  'FINANCE',
  'ADMINISTRATION',
  'TRANSPORT',
  'LIBRARY',
  'ICT',
  'SECURITY',
  'MEDICAL',
  'KITCHEN',
  'MAINTENANCE'
];

export const defaultStaffPositions = [
  'BURSAR',
  'ACCOUNTANT',
  'CASHIER',
  'ADMIN_OFFICER',
  'RECEPTIONIST',
  'LIBRARIAN',
  'LIBRARY_ASSISTANT',
  'CHIEF_SECURITY',
  'SECURITY_GUARD',
  'TRANSPORT_MANAGER',
  'DRIVER',
  'NURSE',
  'MEDICAL_OFFICER',
  'COOK',
  'KITCHEN_STAFF',
  'MAINTENANCE_OFFICER',
  'IT_SUPPORT_SPECIALIST'
];

export const teacherPositionLabels: Record<string, string> = {
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  HOD: 'Head of Department (HOD)',
  SENIOR_TEACHER: 'Senior Teacher',
  CLASS_TEACHER: 'Class Teacher',
  FORM_MASTER: 'Form Master/Mistress',
  SUBJECT_TEACHER: 'Subject Teacher',
  ASSISTANT_TEACHER: 'Assistant Teacher',
};

export const staffCategoryLabels: Record<string, string> = {
  ADMINISTRATIVE: 'Administrative',
  BURSAR: 'Bursar/Finance',
  LIBRARIAN: 'Librarian',
  SECURITY: 'Security',
  CLEANER: 'Cleaner',
  DRIVER: 'Driver',
  COOK: 'Cook',
  MAINTENANCE: 'Maintenance',
  IT_SUPPORT: 'IT Support',
  COUNSELOR: 'Counselor',
  NURSE: 'Nurse',
  TRANSPORT: 'Transport',
};

export const staffDepartmentLabels: Record<string, string> = {
  FINANCE: 'Finance',
  ADMINISTRATION: 'Administration',
  TRANSPORT: 'Transport',
  LIBRARY: 'Library',
  ICT: 'ICT',
  SECURITY: 'Security',
  MEDICAL: 'Medical',
  KITCHEN: 'Kitchen',
  MAINTENANCE: 'Maintenance',
};

export const staffPositionLabels: Record<string, string> = {
  BURSAR: 'Bursar',
  ACCOUNTANT: 'Accountant',
  CASHIER: 'Cashier',
  ADMIN_OFFICER: 'Admin Officer',
  RECEPTIONIST: 'Receptionist',
  LIBRARIAN: 'Librarian',
  LIBRARY_ASSISTANT: 'Library Assistant',
  CHIEF_SECURITY: 'Chief Security Officer',
  SECURITY_GUARD: 'Security Guard',
  TRANSPORT_MANAGER: 'Transport Manager',
  DRIVER: 'Driver',
  NURSE: 'Nurse',
  MEDICAL_OFFICER: 'Medical Officer',
  COOK: 'Cook',
  KITCHEN_STAFF: 'Kitchen Staff',
  MAINTENANCE_OFFICER: 'Maintenance Officer',
  IT_SUPPORT_SPECIALIST: 'IT Support Specialist',
};
