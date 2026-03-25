import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Nigerian curriculum seed...\n');

  const demoSchool = await prisma.tenant.findUnique({
    where: { slug: 'demo-school' },
  });

  if (!demoSchool) {
    console.error('Demo school not found. Run the original seed first.');
    process.exit(1);
  }

  console.log('✅ Found demo school:', demoSchool.name);

  // 1. ACADEMIC YEARS
  let academicYear2025 = await prisma.academicYear.findFirst({
    where: { name: '2025/2026', tenantId: demoSchool.id }
  });
  
  if (!academicYear2025) {
    academicYear2025 = await prisma.academicYear.create({
      data: {
        name: '2025/2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-07-31'),
        isActive: true,
        tenantId: demoSchool.id,
      },
    });
  }

  // 2. TERMS
  let term1 = await prisma.term.findFirst({
    where: { name: 'First Term', academicYearId: academicYear2025.id }
  });
  
  if (!term1) {
    term1 = await prisma.term.create({
      data: {
        name: 'First Term',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-20'),
        isCurrent: true,
        academicYearId: academicYear2025.id,
      },
    });
  }

  let term2 = await prisma.term.findFirst({
    where: { name: 'Second Term', academicYearId: academicYear2025.id }
  });
  
  if (!term2) {
    await prisma.term.create({
      data: {
        name: 'Second Term',
        startDate: new Date('2026-01-08'),
        endDate: new Date('2026-04-10'),
        isCurrent: false,
        academicYearId: academicYear2025.id,
      },
    });
  }

  let term3 = await prisma.term.findFirst({
    where: { name: 'Third Term', academicYearId: academicYear2025.id }
  });
  
  if (!term3) {
    await prisma.term.create({
      data: {
        name: 'Third Term',
        startDate: new Date('2026-04-21'),
        endDate: new Date('2026-07-31'),
        isCurrent: false,
        academicYearId: academicYear2025.id,
      },
    });
  }
  console.log('✅ Academic Years and Terms created');

  // 3. CLASSES (Simplified - key classes only)
  const classData = [
    { name: 'Primary 4', level: 3 },
    { name: 'Primary 5', level: 4 },
    { name: 'Primary 6', level: 5 },
    { name: 'JSS 1', level: 9 },
    { name: 'JSS 2', level: 10 },
    { name: 'JSS 3', level: 11 },
    { name: 'SSS 1 Science', level: 12 },
    { name: 'SSS 2 Science', level: 13 },
    { name: 'SSS 3 Science', level: 14 },
    { name: 'SSS 1 Commercial', level: 12 },
  ];

  const classes: Record<string, any> = {};
  for (const c of classData) {
    let cls = await prisma.academicClass.findFirst({
      where: { name: c.name, academicYearId: academicYear2025.id }
    });
    
    if (!cls) {
      cls = await prisma.academicClass.create({
        data: { name: c.name, level: c.level, capacity: 40, academicYearId: academicYear2025.id },
      });
    }
    classes[c.name] = cls;
  }
  console.log('✅ Classes created');

  // 4. SUBJECTS
  const subjectData: Record<string, { code: string; name: string }[]> = {
    'Primary 4': [
      { code: 'MATH', name: 'Mathematics' },
      { code: 'ENG', name: 'English Language' },
      { code: 'CRT', name: 'Creative Writing' },
      { code: 'SCI', name: 'Basic Science' },
      { code: 'SOS', name: 'Social Studies' },
    ],
    'JSS 1': [
      { code: 'MATH', name: 'Mathematics' },
      { code: 'ENG', name: 'English Language' },
      { code: 'BIO', name: 'Basic Science' },
      { code: 'GEO', name: 'Geography' },
      { code: 'CIV', name: 'Civic Education' },
    ],
    'SSS 1 Science': [
      { code: 'MATH', name: 'Mathematics' },
      { code: 'ENG', name: 'English Language' },
      { code: 'PHY', name: 'Physics' },
      { code: 'CHEM', name: 'Chemistry' },
      { code: 'BIO', name: 'Biology' },
    ],
  };

  const subjects: Record<string, any> = {};
  for (const [clsName, subs] of Object.entries(subjectData)) {
    for (const s of subs) {
      const key = `${clsName}-${s.code}`;
      let subj = await prisma.subject.findFirst({
        where: { code: s.code, academicClassId: classes[clsName].id }
      });
      
      if (!subj) {
        subj = await prisma.subject.create({
          data: { name: s.name, code: s.code, academicClassId: classes[clsName].id },
        });
      }
      subjects[key] = subj;
    }
  }
  console.log('✅ Subjects created');

  // 5. TEACHERS
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teachers: Record<string, any> = {};
  const teacherList = [
    { id: 'TCH001', first: 'Oluwaseun', last: 'Adeyemi', email: 'adeyemi@demo-school.com', subject: 'MATH' },
    { id: 'TCH002', first: 'Folake', last: 'Okonkwo', email: 'okonkwo@demo-school.com', subject: 'ENG' },
    { id: 'TCH003', first: 'Chukwuemeka', last: 'Ibrahim', email: 'ibrahim@demo-school.com', subject: 'PHY' },
    { id: 'TCH004', first: 'Adaeze', last: 'Okafor', email: 'okafor@demo-school.com', subject: 'CHEM' },
    { id: 'TCH005', first: 'Babatunde', last: 'Sani', email: 'sani@demo-school.com', subject: 'BIO' },
  ];

  for (const t of teacherList) {
    // Check if teacher exists first
    let teacher = await prisma.teacher.findFirst({
      where: { employeeId: t.id, tenantId: demoSchool.id }
    });
    
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          employeeId: t.id,
          email: t.email,
          firstName: t.first,
          lastName: t.last,
          specialty: t.subject,
          phone: '+2348012345678',
          joinDate: new Date('2020-09-01'),
          employmentType: 'FULL_TIME',
          tenantId: demoSchool.id,
        },
      });
    }
    teachers[t.id] = teacher;
    
    await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: { email: t.email, password: teacherPassword, firstName: t.first, lastName: t.last, role: 'TEACHER', tenantId: demoSchool.id },
    });
  }
  console.log('✅ Teachers created');

  // 6. STUDENTS
  const studentPassword = await bcrypt.hash('student123', 10);
  const students: Record<string, any> = {};
  const studentList = [
    { id: 'STU001', first: 'Abiodun', last: 'Ayodele', gender: 'MALE', dob: '2014-03-15', class: 'Primary 4' },
    { id: 'STU002', first: 'Chiamaka', last: 'Nnamdi', gender: 'FEMALE', dob: '2014-07-22', class: 'Primary 4' },
    { id: 'STU003', first: 'Emeka', last: 'Ogunleye', gender: 'MALE', dob: '2014-01-10', class: 'Primary 4' },
    { id: 'STU004', first: 'Zainab', last: 'Bello', gender: 'FEMALE', dob: '2013-05-18', class: 'Primary 5' },
    { id: 'STU005', first: 'Toluwanimi', last: 'Olawale', gender: 'MALE', dob: '2013-09-02', class: 'Primary 5' },
    { id: 'STU006', first: 'Chidinma', last: 'Ezeh', gender: 'FEMALE', dob: '2012-11-30', class: 'Primary 6' },
    { id: 'STU007', first: 'Ayomide', last: 'Saheed', gender: 'MALE', dob: '2012-02-14', class: 'Primary 6' },
    { id: 'STU008', first: 'Grace', last: 'Adamu', gender: 'FEMALE', dob: '2011-04-12', class: 'JSS 1' },
    { id: 'STU009', first: 'David', last: 'Okonkwo', gender: 'MALE', dob: '2011-12-05', class: 'JSS 1' },
    { id: 'STU010', first: 'Joshua', last: 'Olagunju', gender: 'MALE', dob: '2010-10-08', class: 'JSS 2' },
    { id: 'STU011', first: 'Victor', last: 'Amadi', gender: 'MALE', dob: '2009-07-11', class: 'JSS 3' },
    { id: 'STU012', first: 'Daniel', last: 'Chukwuma', gender: 'MALE', dob: '2008-09-14', class: 'SSS 1 Science' },
    { id: 'STU013', first: 'Sarah', last: 'Abubakar', gender: 'FEMALE', dob: '2008-05-03', class: 'SSS 1 Science' },
    { id: 'STU014', first: 'Elizabeth', last: 'Uche', gender: 'FEMALE', dob: '2007-08-09', class: 'SSS 2 Science' },
    { id: 'STU015', first: 'Ruth', last: 'Suleiman', gender: 'FEMALE', dob: '2006-12-18', class: 'SSS 3 Science' },
    { id: 'STU016', first: 'Mary', last: 'Ismaila', gender: 'FEMALE', dob: '2008-01-12', class: 'SSS 1 Commercial' },
  ];

  for (const s of studentList) {
    // Check if student exists first
    let student = await prisma.student.findFirst({
      where: { studentId: s.id, tenantId: demoSchool.id }
    });
    
    if (!student) {
      student = await prisma.student.create({
        data: {
          studentId: s.id,
          email: `${s.id.toLowerCase()}@student.demo-school.com`,
          firstName: s.first,
          lastName: s.last,
          dateOfBirth: new Date(s.dob),
          gender: s.gender,
          phone: '+2348012345678',
          address: 'Lagos, Nigeria',
          tenantId: demoSchool.id,
        },
      });
    }
    students[s.id] = student;
    
    await prisma.user.upsert({
      where: { email: `${s.id.toLowerCase()}@student.demo-school.com` },
      update: {},
      create: {
        email: `${s.id.toLowerCase()}@student.demo-school.com`,
        password: studentPassword,
        firstName: s.first,
        lastName: s.last,
        role: 'STUDENT',
        tenantId: demoSchool.id,
      },
    });
  }
  console.log('✅ Students created');

  // 7. ENROLLMENTS
  for (const s of studentList) {
    // Check if enrollment exists first
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: students[s.id].id, classId: classes[s.class].id }
    });
    
    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: { status: 'ACTIVE', tenantId: demoSchool.id, studentId: students[s.id].id, classId: classes[s.class].id },
      });
    }
  }
  console.log('✅ Enrollments created');

  // 8. PARENTS
  const parentPassword = await bcrypt.hash('parent123', 10);
  const parentList = [
    { first: 'Olumide', last: 'Ayodele', email: 'olumide.ayodele@email.com', student: 'STU001' },
    { first: 'Adaeze', last: 'Nnamdi', email: 'adaeze.nnamdi@email.com', student: 'STU002' },
    { first: 'Chinedu', last: 'Ogunleye', email: 'chinedu.ogunleye@email.com', student: 'STU003' },
    { first: 'Aisha', last: 'Bello', email: 'aisha.bello@email.com', student: 'STU004' },
    { first: 'Olusegun', last: 'Olawale', email: 'olusegun.olawale@email.com', student: 'STU005' },
  ];

  for (const p of parentList) {
    const parentUser = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: { email: p.email, password: parentPassword, firstName: p.first, lastName: p.last, role: 'PARENT', tenantId: demoSchool.id },
    });
    const parent = await prisma.parent.create({
      data: {
        firstName: p.first,
        lastName: p.last,
        email: p.email,
        phone: '+2348033334444',
        occupation: 'Business',
        isPrimaryContact: true,
        approvalStatus: 'APPROVED',
        tenantId: demoSchool.id,
        userId: parentUser.id,
      },
    });
    await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: students[p.student].id,
        relationship: 'GUARDIAN',
        isPrimaryContact: true,
        approvalStatus: 'APPROVED',
        tenantId: demoSchool.id,
      },
    });
  }
  console.log('✅ Parents created');

  // 9. TIMETABLE
  const timetable = await prisma.timetable.create({
    data: { name: '2025/2026 Regular', isPublished: true, academicYearId: academicYear2025.id },
  });

  // Primary 4 timetable
  const p4Slots = [
    { day: 1, period: 1, start: '07:30', end: '08:10', code: 'MATH' },
    { day: 1, period: 2, start: '08:10', end: '08:50', code: 'ENG' },
    { day: 1, period: 3, start: '08:50', end: '09:30', code: 'CRT' },
    { day: 1, period: 4, start: '09:30', end: '10:10', code: 'SCI' },
    { day: 2, period: 1, start: '07:30', end: '08:10', code: 'ENG' },
    { day: 2, period: 2, start: '08:10', end: '08:50', code: 'MATH' },
    { day: 2, period: 3, start: '08:50', end: '09:30', code: 'SCI' },
    { day: 3, period: 1, start: '07:30', end: '08:10', code: 'MATH' },
    { day: 3, period: 2, start: '08:10', end: '08:50', code: 'ENG' },
    { day: 4, period: 1, start: '07:30', end: '08:10', code: 'SOS' },
    { day: 5, period: 1, start: '07:30', end: '08:10', code: 'CRT' },
  ];

  for (const slot of p4Slots) {
    const subj = subjects[`Primary 4-${slot.code}`];
    if (subj) {
      await prisma.timetableSlot.create({
        data: { timetableId: timetable.id, academicClassId: classes['Primary 4'].id, subjectId: subj.id, dayOfWeek: slot.day, period: slot.period, startTime: slot.start, endTime: slot.end },
      }).catch(() => {});
    }
  }

  // SSS 1 Science timetable
  const sssSlots = [
    { day: 1, period: 1, start: '07:30', end: '08:20', code: 'MATH' },
    { day: 1, period: 2, start: '08:20', end: '09:10', code: 'ENG' },
    { day: 1, period: 3, start: '09:10', end: '10:00', code: 'PHY' },
    { day: 1, period: 4, start: '10:00', end: '10:50', code: 'CHEM' },
    { day: 1, period: 5, start: '10:50', end: '11:40', code: 'BIO' },
    { day: 2, period: 1, start: '07:30', end: '08:20', code: 'ENG' },
    { day: 2, period: 2, start: '08:20', end: '09:10', code: 'MATH' },
    { day: 2, period: 3, start: '09:10', end: '10:00', code: 'CHEM' },
    { day: 3, period: 1, start: '07:30', end: '08:20', code: 'BIO' },
    { day: 3, period: 2, start: '08:20', end: '09:10', code: 'PHY' },
    { day: 4, period: 1, start: '07:30', end: '08:20', code: 'MATH' },
    { day: 5, period: 1, start: '07:30', end: '08:20', code: 'PHY' },
  ];

  for (const slot of sssSlots) {
    const subj = subjects[`SSS 1 Science-${slot.code}`];
    if (subj) {
      await prisma.timetableSlot.create({
        data: { timetableId: timetable.id, academicClassId: classes['SSS 1 Science'].id, subjectId: subj.id, dayOfWeek: slot.day, period: slot.period, startTime: slot.start, endTime: slot.end },
      }).catch(() => {});
    }
  }
  console.log('✅ Timetable created');

  // 10. FEE STRUCTURES
  const fees = [
    { name: 'Tuition Fee', amount: 150000, type: 'TUITION' },
    { name: 'Registration Fee', amount: 10000, type: 'REGISTRATION' },
    { name: 'Uniform', amount: 25000, type: 'UNIFORM' },
    { name: 'Books', amount: 30000, type: 'EXTRA_CURRICULAR' },
  ];

  for (const f of fees) {
    await prisma.feeStructure.create({
      data: { name: f.name, description: f.name, amount: f.amount, type: f.type, category: 'MANDATORY', academicYearId: academicYear2025.id, termId: f.type === 'TUITION' ? term1.id : null, tenantId: demoSchool.id },
    }).catch(() => {});
  }
  console.log('✅ Fee structures created');

  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED COMPLETED!');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log('  • Academic Years: 1');
  console.log('  • Terms: 3');
  console.log('  • Classes: ' + classData.length);
  console.log('  • Teachers: ' + teacherList.length);
  console.log('  • Students: ' + studentList.length);
  console.log('  • Parents: ' + parentList.length);
  console.log('\n🔑 Test Accounts:');
  console.log('  Teachers: adeyemi@demo-school.com / teacher123');
  console.log('  Students: stu001@student.demo-school.com / student123');
  console.log('  Parents: olumide.ayodele@email.com / parent123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
