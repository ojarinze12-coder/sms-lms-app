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
  bankName: string;
  bankAccount: string;
  bankSortCode: string;
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
  bankName: '',
  bankAccount: '',
  bankSortCode: '',
});
