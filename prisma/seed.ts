import { PrismaClient, Curriculum } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

// Nigerian school tier structure
const ALL_TIERS = [
  { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
  { name: 'Nursery', code: 'NUR', order: 2 },
  { name: 'Primary', code: 'PRI', order: 3 },
  { name: 'JSS', code: 'JSS', order: 4 },
  { name: 'SSS', code: 'SSS', order: 5 },
];

// SSS Department subjects
const SSS_DEPARTMENTS = [
  {
    name: 'Sciences',
    code: 'SCI',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Agricultural Science', 'Computer Science']
  },
  {
    name: 'Commercial',
    code: 'COM',
    subjects: ['Mathematics', 'Economics', 'Accounting', 'Commerce', 'Government', 'Business Studies', 'Civic Education']
  },
  {
    name: 'Arts',
    code: 'ART',
    subjects: ['Mathematics', 'Literature in English', 'Government', 'History', 'Geography', 'Christian Religious Studies', 'Islamic Religious Studies']
  },
];

// Nigerian curriculum classes per tier
const NIGERIAN_CLASSES: Record<string, { name: string; level: number }[]> = {
  PRE_NUR: [
    { name: 'Pre-Nursery 1', level: 1 },
    { name: 'Pre-Nursery 2', level: 2 },
  ],
  NUR: [
    { name: 'Nursery 1', level: 3 },
    { name: 'Nursery 2', level: 4 },
    { name: 'Nursery 3', level: 5 },
  ],
  PRI: [
    { name: 'Primary 1', level: 6 },
    { name: 'Primary 2', level: 7 },
    { name: 'Primary 3', level: 8 },
    { name: 'Primary 4', level: 9 },
    { name: 'Primary 5', level: 10 },
    { name: 'Primary 6', level: 11 },
  ],
  JSS: [
    { name: 'JSS 1', level: 12 },
    { name: 'JSS 2', level: 13 },
    { name: 'JSS 3', level: 14 },
  ],
  SSS: [
    { name: 'SSS 1', level: 15 },
    { name: 'SSS 2', level: 16 },
    { name: 'SSS 3', level: 17 },
  ],
};

// Core subjects for each tier
const CORE_SUBJECTS: Record<string, string[]> = {
  PRE_NUR: ['Basic Literacy', 'Numeracy', 'Rhymes & Songs', 'Art & Craft', 'Physical Education'],
  NUR: ['English', 'Mathematics', 'Basic Science', 'Social Studies', 'Creative Arts', 'Health Education'],
  PRI: ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies', 'Yoruba Language'],
  JSS: ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Agricultural Science', 'Business Studies', 'Yoruba Language', 'Christian Religious Studies', 'Islamic Religious Studies'],
  SSS: ['Mathematics', 'English Language', 'Civic Education', 'Economics', 'Government', 'Chemistry', 'Physics', 'Biology'],
};

async function main() {
  console.log('Starting seed...');

  // Create Super Admin with strong password
  const superAdminPassword = await bcrypt.hash('SuperAdmin@2024#Secure!', 12);
  
  const superAdminTenant = await prisma.tenant.upsert({
    where: { slug: 'edunext-platform' },
    update: {},
    create: {
      name: 'EduNext Platform',
      slug: 'edunext-platform',
      domain: 'edunext.com',
      plan: 'ENTERPRISE',
      brandColor: '#1a56db',
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@edunext.com' },
    update: {},
    create: {
      email: 'superadmin@edunext.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: superAdminTenant.id,
    },
  });

  console.log('Created super admin:', superAdmin.email);

  // Create Demo School (Tenant)
  const demoSchoolPassword = await bcrypt.hash('admin123', 10);
  
  const demoSchool = await prisma.tenant.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School Nigeria',
      slug: 'demo-school',
      plan: 'PROFESSIONAL',
      brandColor: '#059669',
    },
  });

  // Create Tenant Settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: demoSchool.id },
    update: {},
    create: {
      tenantId: demoSchool.id,
      curriculumType: 'NERDC' as Curriculum,
      usePerTierCurriculum: false,
      tiersSetupComplete: true,
    },
  });

  // Create all tiers
  const createdTiers: Record<string, { id: string }> = {};
  for (const tier of ALL_TIERS) {
    const createdTier = await prisma.tier.upsert({
      where: {
        tenantId_code: { tenantId: demoSchool.id, code: tier.code }
      },
      update: {},
      create: {
        name: tier.name,
        code: tier.code,
        order: tier.order,
        tenantId: demoSchool.id,
      },
    });
    createdTiers[tier.code] = createdTier;

    // Create tier curriculum
    await prisma.tierCurriculum.upsert({
      where: { tierId: createdTier.id },
      update: {},
      create: {
        tierId: createdTier.id,
        curriculum: 'NERDC' as Curriculum,
        tenantId: demoSchool.id,
      },
    });
  }
  console.log('Created tiers:', Object.keys(createdTiers).join(', '));

  // Create SSS Departments
  const sssTier = createdTiers['SSS'];
  const departments: Record<string, { id: string }> = {};
  
  for (const dept of SSS_DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: {
        tenantId_code: { tenantId: demoSchool.id, code: dept.code }
      },
      update: {},
      create: {
        name: dept.name,
        code: dept.code,
        tierId: sssTier.id,
        tenantId: demoSchool.id,
      },
    });
    departments[dept.code] = department;
  }
  console.log('Created SSS departments:', Object.keys(departments).join(', '));

  // Create School Admin
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo-school.com' },
    update: {},
    create: {
      email: 'admin@demo-school.com',
      password: demoSchoolPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: 'ADMIN',
      tenantId: demoSchool.id,
    },
  });

  console.log('Created school admin:', schoolAdmin.email);

  // Create Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: {
      tenantId_name: {
        tenantId: demoSchool.id,
        name: '2025-2026',
      }
    },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
      tenantId: demoSchool.id,
    },
  });

  console.log('Created academic year:', academicYear.name);

  // Create Terms
  const terms = [
    { name: 'First Term', startDate: '2025-09-01', endDate: '2025-12-20' },
    { name: 'Second Term', startDate: '2026-01-06', endDate: '2026-04-10' },
    { name: 'Third Term', startDate: '2026-04-21', endDate: '2026-06-30' },
  ];

  for (let i = 0; i < terms.length; i++) {
    const termData = terms[i];
    await prisma.term.upsert({
      where: {
        academicYearId_name: {
          academicYearId: academicYear.id,
          name: termData.name,
        }
      },
      update: {},
      create: {
        name: termData.name,
        startDate: new Date(termData.startDate),
        endDate: new Date(termData.endDate),
        isCurrent: i === 0,
        academicYearId: academicYear.id,
      },
    });
  }
  console.log('Created terms:', terms.map(t => t.name).join(', '));

  // Create Teachers
  const teachers = [
    { employeeId: 'TCH001', firstName: 'Adaeze', lastName: 'Okonkwo', specialty: 'Mathematics', email: 'adaeze@demo-school.com' },
    { employeeId: 'TCH002', firstName: 'Emmanuel', lastName: 'Adeyemi', specialty: 'English Language', email: 'emmanuel@demo-school.com' },
    { employeeId: 'TCH003', firstName: 'Fatima', lastName: 'Ibrahim', specialty: 'Chemistry', email: 'fatima@demo-school.com' },
    { employeeId: 'TCH004', firstName: 'Chinedu', lastName: 'Eze', specialty: 'Physics', email: 'chinedu@demo-school.com' },
    { employeeId: 'TCH005', firstName: 'Blessing', lastName: 'Adeola', specialty: 'Biology', email: 'blessing@demo-school.com' },
  ];

  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const createdTeachers: Record<string, { id: string }> = {};

  for (const teacherData of teachers) {
    let teacher = await prisma.teacher.findFirst({
      where: { employeeId: teacherData.employeeId, tenantId: demoSchool.id }
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          employeeId: teacherData.employeeId,
          email: teacherData.email,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          specialty: teacherData.specialty,
          phone: '+2348012345678',
          tenantId: demoSchool.id,
        },
      });
    }
    createdTeachers[teacherData.employeeId] = teacher;

    // Create teacher user
    await prisma.user.upsert({
      where: { email: teacherData.email },
      update: {},
      create: {
        email: teacherData.email,
        password: teacherPassword,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        role: 'TEACHER',
        tenantId: demoSchool.id,
      },
    });
  }
  console.log('Created teachers:', teachers.length);

  // Create Classes for each tier
  const createdClasses: Record<string, { id: string }[]> = {};
  
  for (const tier of ALL_TIERS) {
    const tierData = NIGERIAN_CLASSES[tier.code];
    if (!tierData) continue;

    createdClasses[tier.code] = [];
    
    for (const classData of tierData) {
      const academicClass = await prisma.academicClass.upsert({
        where: {
          academicYearId_name: {
            academicYearId: academicYear.id,
            name: classData.name,
          }
        },
        update: {},
        create: {
          name: classData.name,
          level: classData.level,
          capacity: tier.code === 'SSS' ? 35 : 40,
          academicYearId: academicYear.id,
          tierId: createdTiers[tier.code].id,
        },
      });
      createdClasses[tier.code].push(academicClass);
    }
  }
  console.log('Created classes for tiers:', Object.keys(createdClasses).join(', '));

  // Create Subjects for each class
  let subjectCount = 0;
  for (const tier of ALL_TIERS) {
    const subjects = CORE_SUBJECTS[tier.code];
    if (!subjects) continue;

    const tierClasses = createdClasses[tier.code];
    
    for (const academicClass of tierClasses) {
      for (let i = 0; i < subjects.length; i++) {
        const subjectName = subjects[i];
        const code = subjectName.toUpperCase().replace(/\s+/g, '_').substring(0, 8) + '_' + (i + 1);
        
        await prisma.subject.upsert({
          where: {
            academicClassId_code: {
              academicClassId: academicClass.id,
              code,
            }
          },
          update: {},
          create: {
            name: subjectName,
            code,
            academicClassId: academicClass.id,
            teacherId: createdTeachers['TCH001']?.id,
            curriculum: 'NERDC',
          },
        });
        subjectCount++;
      }
    }
  }
  console.log('Created subjects:', subjectCount);

  // Create SSS Department Subjects (without academicClassId)
  for (const dept of SSS_DEPARTMENTS) {
    const department = departments[dept.code];
    if (!department) continue;

    for (let i = 0; i < dept.subjects.length; i++) {
      const subjectName = dept.subjects[i];
      const code = `${dept.code}_${subjectName.toUpperCase().replace(/\s+/g, '_').substring(0, 6)}`;
      
      try {
        // Check if subject already exists by name and department
        const existing = await prisma.subject.findFirst({
          where: {
            name: subjectName,
            departmentId: department.id,
          }
        });
        
        if (!existing) {
          await prisma.subject.create({
            data: {
              name: subjectName,
              code,
              departmentId: department.id,
              curriculum: 'NERDC',
            },
          });
        }
      } catch (e) {
        console.log('Subject already exists or error:', subjectName);
      }
    }
  }

  // Create Students
  const studentPassword = await bcrypt.hash('student123', 10);
  const studentData = [
    { studentId: 'STU001', firstName: 'Amaka', lastName: 'Okafor', gender: 'FEMALE', className: 'SSS 1' },
    { studentId: 'STU002', firstName: 'Tunde', lastName: 'Bakare', gender: 'MALE', className: 'SSS 1' },
    { studentId: 'STU003', firstName: 'Zainab', lastName: 'Abubakar', gender: 'FEMALE', className: 'SSS 2' },
    { studentId: 'STU004', firstName: 'Emeka', lastName: 'Nwosu', gender: 'MALE', className: 'SSS 2' },
    { studentId: 'STU005', firstName: 'Chioma', lastName: 'Eze', gender: 'FEMALE', className: 'SSS 3' },
    { studentId: 'STU006', firstName: 'Olumide', lastName: 'Ayodele', gender: 'MALE', className: 'JSS 1' },
    { studentId: 'STU007', firstName: 'Ngozi', lastName: 'Moses', gender: 'FEMALE', className: 'JSS 1' },
    { studentId: 'STU008', firstName: 'Ibrahim', lastName: 'Suleiman', gender: 'MALE', className: 'Primary 5' },
    { studentId: 'STU009', firstName: 'Adaobi', lastName: 'Nweke', gender: 'FEMALE', className: 'Primary 5' },
    { studentId: 'STU010', firstName: 'Samuel', lastName: 'Ogundimu', gender: 'MALE', className: 'Nursery 3' },
  ];

  for (const student of studentData) {
    // Find class
    let classId = '';
    for (const tier of ALL_TIERS) {
      const classes = createdClasses[tier.code] || [];
      const found = classes.find(c => c.name === student.className);
      if (found) {
        classId = found.id;
        break;
      }
    }

    const createdStudent = await prisma.student.upsert({
      where: {
        tenantId_studentId: {
          tenantId: demoSchool.id,
          studentId: student.studentId,
        }
      },
      update: {},
      create: {
        studentId: student.studentId,
        email: `${student.firstName.toLowerCase()}@student.demo-school.com`,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: new Date('2010-05-15'),
        gender: student.gender,
        phone: '+2348012345678',
        address: 'Lagos, Nigeria',
        tenantId: demoSchool.id,
      },
    });

    // Create student user
    await prisma.user.upsert({
      where: { email: `${student.firstName.toLowerCase()}@student.demo-school.com` },
      update: {},
      create: {
        email: `${student.firstName.toLowerCase()}@student.demo-school.com`,
        password: studentPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'STUDENT',
        tenantId: demoSchool.id,
      },
    });

    // Enroll student in class
    if (classId) {
      await prisma.enrollment.upsert({
        where: {
          tenantId_studentId_classId: {
            tenantId: demoSchool.id,
            studentId: createdStudent.id,
            classId,
          }
        },
        update: {},
        create: {
          tenantId: demoSchool.id,
          studentId: createdStudent.id,
          classId,
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('Created students:', studentData.length);

  // Create Subscription for demo school (use relation via tenant)
  const existingSub = await prisma.subscription.findUnique({
    where: { tenantId: demoSchool.id }
  });
  
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        tenantId: demoSchool.id,
        status: 'ACTIVE',
        billingCycle: 'YEARLY',
      },
    });
  }

  console.log('Created subscription');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📚 Demo School Structure:');
  console.log('   Tiers:', ALL_TIERS.map(t => t.name).join(', '));
  console.log('   SSS Departments:', SSS_DEPARTMENTS.map(d => d.name).join(', '));
  console.log('   Total Classes:', Object.values(createdClasses).flat().length);
  console.log('   Total Subjects:', subjectCount);
  
  console.log('\n🔐 Test Accounts:');
  console.log('   Super Admin: superadmin@edunext.com / SuperAdmin@2024#Secure!');
  console.log('   School Admin: admin@demo-school.com / admin123');
  console.log('   Teachers: teacher@demo-school.com, adaeze@demo-school.com, etc. / teacher123');
  console.log('   Students: Various / student123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
