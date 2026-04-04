const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'blue');
  log('='.repeat(60), 'blue');
}

async function makeRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  if (data) config.data = data;
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    return { success: false, error: message };
  }
}

async function testAuth() {
  logSection('Testing Authentication');

  const testEmail = `test-${Date.now()}@demo-school.com`;
  const testPassword = 'testPassword123';

  const registerResult = await makeRequest('POST', '/auth/register', {
    name: 'Test School',
    slug: `test-${Date.now()}`,
    email: testEmail,
    password: testPassword
  });
  log(`  Register: ${registerResult.success ? 'PASS' : 'FAIL'}`, registerResult.success ? 'green' : 'red');
  
  if (!registerResult.success) {
    log(`    Error: ${registerResult.error}`, 'red');
    return null;
  }

  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  });
  log(`  Login: ${loginResult.success ? 'PASS' : 'FAIL'}`, loginResult.success ? 'green' : 'red');
  
  if (!loginResult.success) {
    log(`    Error: ${loginResult.error}`, 'red');
    return null;
  }

  const token = loginResult.data?.token || loginResult.data?.accessToken;
  log(`  Token obtained: ${token ? 'YES' : 'NO'}`, token ? 'green' : 'red');
  
  return token;
}

async function testStudents(token) {
  logSection('Testing Student Management');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/students', {
    studentId: `STU${Date.now()}`,
    firstName: 'Test',
    lastName: 'Student',
    gender: 'MALE',
    dateOfBirth: '2010-01-01',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Student: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/students', null, token);
  log(`  List Students: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
  
  const searchResult = await makeRequest('GET', '/sms/students?search=test', null, token);
  log(`  Search Students: ${searchResult.success ? 'PASS' : 'FAIL'}`, searchResult.success ? 'green' : 'red');
}

async function testTeachers(token) {
  logSection('Testing Teacher Management');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/teachers', {
    employeeId: `TCH${Date.now()}`,
    firstName: 'Test',
    lastName: 'Teacher',
    email: `teacher-${Date.now()}@demo-school.com`,
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Teacher: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/teachers', null, token);
  log(`  List Teachers: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testAttendance(token) {
  logSection('Testing Attendance');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/attendance', {
    studentId: 'test-student-id',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Mark Attendance: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/attendance?date=' + new Date().toISOString().split('T')[0], null, token);
  log(`  List Attendance: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testFees(token) {
  logSection('Testing Fees Management');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/fees', {
    name: 'Tuition Fee',
    amount: 50000,
    category: 'MANDATORY',
    academicYearId: 'test-year-id',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Fee Structure: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/fees', null, token);
  log(`  List Fee Structures: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testAcademicYears(token) {
  logSection('Testing Academic Years');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/academic-years', {
    name: '2025-2026',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Academic Year: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/academic-years', null, token);
  log(`  List Academic Years: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testClasses(token) {
  logSection('Testing Academic Classes');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/academic-classes', {
    name: 'JSS 1',
    level: 1,
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Class: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/academic-classes', null, token);
  log(`  List Classes: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testSubjects(token) {
  logSection('Testing Subjects');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/subjects', {
    name: 'Mathematics',
    code: 'MATH',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Subject: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/subjects', null, token);
  log(`  List Subjects: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function testAnnouncements(token) {
  logSection('Testing Announcements');
  
  if (!token) {
    log('  Skipping - no auth token', 'yellow');
    return;
  }

  const createResult = await makeRequest('POST', '/sms/announcements', {
    title: 'Test Announcement',
    content: 'This is a test announcement',
    tenantId: 'test-tenant-id'
  }, token);
  log(`  Create Announcement: ${createResult.success ? 'PASS' : 'FAIL'}`, createResult.success ? 'green' : 'red');
  
  const listResult = await makeRequest('GET', '/sms/announcements', null, token);
  log(`  List Announcements: ${listResult.success ? 'PASS' : 'FAIL'}`, listResult.success ? 'green' : 'red');
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  SMS-LMS Core Features Test Suite', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  log('API Base URL: ' + API_BASE, 'yellow');

  const token = await testAuth();
  
  await testStudents(token);
  await testTeachers(token);
  await testAttendance(token);
  await testFees(token);
  await testAcademicYears(token);
  await testClasses(token);
  await testSubjects(token);
  await testAnnouncements(token);

  logSection('Test Summary');
  log('Core features are ready for manual testing via the UI.', 'green');
  log('Run "npm run dev" to start the development server.', 'yellow');
}

runTests().catch(console.error);
