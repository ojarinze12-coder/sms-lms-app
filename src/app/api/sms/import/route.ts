import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authUser.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const mapping = JSON.parse(formData.get('mapping') as string);
    const academicYearId = formData.get('academicYearId') as string;
    const classId = formData.get('classId') as string;
    const autoEnroll = formData.get('autoEnroll') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = { success: 0, failed: 0, skipped: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record: any = {};

      headers.forEach((header, index) => {
        const field = mapping[header];
        if (field && values[index]) {
          record[field] = values[index].trim();
        }
      });

      try {
        if (type === 'students') {
          if (!record.firstName || !record.lastName) {
            results.skipped++;
            results.errors.push(`Row ${i}: Missing required fields (firstName, lastName)`);
            continue;
          }

          const existingStudent = record.studentId ? await prisma.student.findFirst({
            where: { studentId: record.studentId, tenantId },
          }) : null;

          if (existingStudent) {
            results.skipped++;
            results.errors.push(`Row ${i}: Student with ID ${record.studentId} already exists`);
            continue;
          }

          const studentId = record.studentId || `STU/${Date.now()}-${i}`;
          
          const student = await prisma.student.create({
            data: {
              studentId,
              firstName: record.firstName,
              lastName: record.lastName,
              middleName: record.middleName,
              gender: record.gender?.toUpperCase(),
              email: record.email,
              phone: record.phone,
              address: record.address,
              stateOfOrigin: record.stateOfOrigin,
              lgaOfOrigin: record.lgaOfOrigin,
              tenantId,
              status: 'ACTIVE',
            },
          });

          if (autoEnroll && classId && academicYearId) {
            await prisma.enrollment.create({
              data: {
                studentId: student.id,
                academicClassId: classId,
                academicYearId,
                tenantId,
                status: 'ACTIVE',
              },
            });
          }

          results.success++;
        } 
        else if (type === 'teachers') {
          if (!record.firstName || !record.lastName || !record.email) {
            results.skipped++;
            results.errors.push(`Row ${i}: Missing required fields`);
            continue;
          }

          const existingTeacher = await prisma.teacher.findFirst({
            where: { email: record.email, tenantId },
          });

          if (existingTeacher) {
            results.skipped++;
            results.errors.push(`Row ${i}: Teacher with email ${record.email} already exists`);
            continue;
          }

          // Get department ID if department name is provided
          let departmentId = null;
          if (record.department) {
            const dept = await prisma.department.findFirst({
              where: { 
                name: { mode: 'insensitive', contains: record.department },
                tenantId 
              },
            });
            departmentId = dept?.id || null;
          }

          const employeeId = record.employeeId || `EMP/${Date.now()}-${i}`;
          
          await prisma.teacher.create({
            data: {
              employeeId,
              firstName: record.firstName,
              lastName: record.lastName,
              email: record.email,
              phone: record.phone,
              department: record.department,
              specialty: record.specialty,
              qualification: record.qualification,
              position: record.position || null,
              departmentId,
              tenantId,
              status: 'ACTIVE',
            },
          });
          results.success++;
        }
        else if (type === 'staff') {
          if (!record.firstName || !record.lastName || !record.email) {
            results.skipped++;
            results.errors.push(`Row ${i}: Missing required fields`);
            continue;
          }

          const existingStaff = await prisma.staff.findFirst({
            where: { email: record.email, tenantId },
          });

          if (existingStaff) {
            results.skipped++;
            results.errors.push(`Row ${i}: Staff with email ${record.email} already exists`);
            continue;
          }

          // Map category from common names to enum values
          const categoryMap: Record<string, string> = {
            'admin': 'ADMINISTRATIVE',
            'administrative': 'ADMINISTRATIVE',
            'bursar': 'BURSAR',
            'finance': 'BURSAR',
            'librarian': 'LIBRARIAN',
            'library': 'LIBRARIAN',
            'security': 'SECURITY',
            'guard': 'SECURITY',
            'cleaner': 'CLEANER',
            'janitor': 'CLEANER',
            'driver': 'DRIVER',
            'transport': 'DRIVER',
            'cook': 'COOK',
            'kitchen': 'COOK',
            'maintenance': 'MAINTENANCE',
            'it': 'IT_SUPPORT',
            'it support': 'IT_SUPPORT',
            'counselor': 'COUNSELOR',
            'counselling': 'COUNSELOR',
            'nurse': 'NURSE',
            'health': 'NURSE',
            'caregiver': 'CAREGIVER',
            'care giver': 'CAREGIVER',
            'nursery': 'CAREGIVER',
            'teaching': 'TEACHING',
            'teacher': 'TEACHING',
          };
          
          const category = categoryMap[record.category?.toLowerCase()] || record.category?.toUpperCase() || 'OTHER';

          const employeeId = record.employeeId || `STF/${Date.now()}-${i}`;
          
          await prisma.staff.create({
            data: {
              employeeId,
              firstName: record.firstName,
              lastName: record.lastName,
              email: record.email,
              phone: record.phone,
              category: category as any,
              department: record.department,
              position: record.designation,
              tenantId,
              status: 'ACTIVE',
            },
          });
          results.success++;
        }
        else if (type === 'parents') {
          if (!record.firstName || !record.lastName || !record.phone || !record.studentId) {
            results.skipped++;
            results.errors.push(`Row ${i}: Missing required fields`);
            continue;
          }

          const student = await prisma.student.findFirst({
            where: { studentId: record.studentId, tenantId },
          });

          if (!student) {
            results.failed++;
            results.errors.push(`Row ${i}: Student not found with ID ${record.studentId}`);
            continue;
          }

          await prisma.parent.create({
            data: {
              firstName: record.firstName,
              lastName: record.lastName,
              email: record.email,
              phone: record.phone,
              occupation: record.occupation,
              studentId: student.id,
              tenantId,
            },
          });
          results.success++;
        }
        else if (type === 'legacy') {
          if (!record.studentId || !record.academicYear || !record.className) {
            results.skipped++;
            results.errors.push(`Row ${i}: Missing required fields for legacy record`);
            continue;
          }

          const student = await prisma.student.findFirst({
            where: { studentId: record.studentId, tenantId },
          });

          if (!student) {
            results.failed++;
            results.errors.push(`Row ${i}: Student not found with ID ${record.studentId}`);
            continue;
          }

          let academicYear = await prisma.academicYear.findFirst({
            where: { name: record.academicYear, tenantId },
          });

          if (!academicYear) {
            academicYear = await prisma.academicYear.create({
              data: {
                name: record.academicYear,
                tenantId,
                isActive: false,
              },
            });
          }

          let academicClass = await prisma.academicClass.findFirst({
            where: { name: record.className, academicYearId: academicYear.id },
          });

          if (!academicClass) {
            academicClass = await prisma.academicClass.create({
              data: {
                name: record.className,
                level: 1,
                academicYearId: academicYear.id,
                tenantId,
              },
            });
          }

          let term = record.term ? await prisma.term.findFirst({
            where: { name: record.term, academicYearId: academicYear.id },
          }) : null;

          if (!term && record.term) {
            term = await prisma.term.create({
              data: {
                name: record.term,
                academicYearId: academicYear.id,
                tenantId,
                isCurrent: false,
                startDate: new Date(),
                endDate: new Date(),
              },
            });
          }

          if (record.subject && (record.caScore || record.examScore)) {
            const totalScore = record.totalScore || 
              ((parseFloat(record.caScore) || 0) + (parseFloat(record.examScore) || 0));

            await prisma.result.create({
              data: {
                studentId: student.id,
                academicYearId: academicYear.id,
                academicClassId: academicClass.id,
                termId: term?.id,
                subject: record.subject,
                caScore: parseFloat(record.caScore) || 0,
                examScore: parseFloat(record.examScore) || 0,
                totalScore,
                grade: record.grade,
                remarks: record.remarks,
                tenantId,
              },
            });
          }

          results.success++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${i}: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
