import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { parse } from 'path';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};

      headers.forEach((header, index) => {
        const field = mapping[header];
        if (field) {
          record[field] = values[index];
        }
      });

      try {
        if (type === 'students') {
          const studentId = record.studentId || `STU/${Date.now()}-${i}`;
          
          await prisma.student.create({
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
          results.success++;
        } 
        else if (type === 'teachers') {
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
              tenantId,
              status: 'ACTIVE',
            },
          });
          results.success++;
        }
        else if (type === 'parents') {
          const student = await prisma.student.findFirst({
            where: { studentId: record.studentId, tenantId },
          });

          if (student) {
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
          } else {
            results.failed++;
            results.errors.push(`Row ${i}: Student not found with ID ${record.studentId}`);
          }
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
