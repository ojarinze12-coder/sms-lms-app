import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function backfillBranchIds() {
  console.log('Starting branchId backfill...');
  
  // First, check current data state
  console.log('\n[0] Current Data State:');
  
  const branches = await prisma.$queryRaw<{id: string, name: string, "tenantId": string}[]>`
    SELECT id, name, "tenantId" FROM branches LIMIT 5
  `;
  console.log('  Branches:', branches.length, branches.map(b => ({ id: b.id, name: b.name })));
  
  const studentsWithBranch = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM students WHERE "branchId" IS NOT NULL
  `;
  console.log(`  Students with branchId: ${studentsWithBranch[0]?.count || 0}`);
  
  const studentsWithoutBranch = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM students WHERE "branchId" IS NULL
  `;
  console.log(`  Students without branchId: ${studentsWithoutBranch[0]?.count || 0}`);
  
  // Get branch IDs for the main branch
  if (branches.length > 0) {
    const mainBranchId = branches[0].id;
    console.log(`\n  Using main branch: ${mainBranchId}`);
    
    // Update students without branchId to have one (for demo purposes)
    console.log('\n[?] Backfilling Students without branchId...');
    const updateStudents = await prisma.$executeRaw`
      UPDATE students
      SET "branchId" = ${mainBranchId}::uuid
      WHERE "branchId" IS NULL
    `;
    console.log(`  Updated ${updateStudents} students`);
    
    // Now backfill related records
    let totalUpdated = 0;
    
    // 1. Backfill Enrollments - get branchId from student
    console.log('\n[1] Backfilling Enrollments...');
    const enrollmentsResult = await prisma.$executeRaw`
      UPDATE "enrollments" e
      SET "branchId" = s."branchId"
      FROM "students" s
      WHERE e."studentId" = s.id
      AND e."branchId" IS NULL
      AND s."branchId" IS NOT NULL
    `;
    console.log(`  Updated ${enrollmentsResult} enrollments`);
    totalUpdated += Number(enrollmentsResult);
    
    // 2. Backfill Attendance - get branchId from student
    console.log('\n[2] Backfilling Attendance (student-based)...');
    const attendanceStudentResult = await prisma.$executeRaw`
      UPDATE "attendances" a
      SET "branchId" = s."branchId"
      FROM "students" s
      WHERE a."studentId" = s.id
      AND a."branchId" IS NULL
      AND s."branchId" IS NOT NULL
    `;
    console.log(`  Updated ${attendanceStudentResult} attendance records`);
    totalUpdated += Number(attendanceStudentResult);
    
    // 3. Backfill FeePayments - get branchId from student
    console.log('\n[3] Backfilling FeePayments...');
    const feePaymentsResult = await prisma.$executeRaw`
      UPDATE "fee_payments" fp
      SET "branchId" = s."branchId"
      FROM "students" s
      WHERE fp."studentId" = s.id
      AND fp."branchId" IS NULL
      AND s."branchId" IS NOT NULL
    `;
    console.log(`  Updated ${feePaymentsResult} fee payments`);
    totalUpdated += Number(feePaymentsResult);
    
    // 4. Backfill Results - get branchId from student
    console.log('\n[4] Backfilling Results...');
    const resultsResult = await prisma.$executeRaw`
      UPDATE "results" r
      SET "branchId" = s."branchId"
      FROM "students" s
      WHERE r."studentId" = s.id
      AND r."branchId" IS NULL
      AND s."branchId" IS NOT NULL
    `;
    console.log(`  Updated ${resultsResult} results`);
    totalUpdated += Number(resultsResult);
    
    // 5. Check AcademicClasses
    console.log('\n[5] Checking AcademicClasses branchId...');
    const classesWithBranch = await prisma.academicClass.count({
      where: { branchId: { not: null } }
    });
    const classesWithoutBranch = await prisma.academicClass.count({
      where: { branchId: null }
    });
    console.log(`  Classes with branchId: ${classesWithBranch}`);
    console.log(`  Classes without branchId: ${classesWithoutBranch}`);
    
    // 6. Check FeeStructures
    console.log('\n[6] Checking FeeStructures branchId...');
    const feeStructuresWithBranch = await prisma.feeStructure.count({
      where: { branchId: { not: null } }
    });
    const feeStructuresWithoutBranch = await prisma.feeStructure.count({
      where: { branchId: null }
    });
    console.log(`  FeeStructures with branchId: ${feeStructuresWithBranch}`);
    console.log(`  FeeStructures without branchId: ${feeStructuresWithoutBranch}`);
    
    // 7. Backfill TimetableSlots - get branchId from academicClass
    console.log('\n[7] Backfilling TimetableSlots...');
    const timetableResult = await prisma.$executeRaw`
      UPDATE "timetable_slots" ts
      SET "branchId" = ac."branchId"
      FROM "academic_classes" ac
      WHERE ts."academicClassId" = ac.id
      AND ts."branchId" IS NULL
      AND ac."branchId" IS NOT NULL
    `;
    console.log(`  Updated ${timetableResult} timetable slots`);
    totalUpdated += Number(timetableResult);
    
    // Summary
    console.log('\n========================================');
    console.log(`Total records updated: ${totalUpdated}`);
    console.log('========================================\n');
  } else {
    console.log('\nNo branches found. Skipping backfill.');
  }
}

backfillBranchIds()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });