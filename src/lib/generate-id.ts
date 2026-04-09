export async function generateStudentId(tenantId: string): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  
  const year = new Date().getFullYear();
  const prefix = 'STU';
  
  const lastStudent = await prisma.student.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { studentId: true }
  });
  
  let nextNum = 1;
  if (lastStudent?.studentId) {
    const match = lastStudent.studentId.match(/STU\/\d{4}\/(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}/${year}/${nextNum.toString().padStart(3, '0')}`;
}

export async function generateTeacherId(tenantId: string): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  
  const year = new Date().getFullYear();
  const prefix = 'TCH';
  
  const lastTeacher = await prisma.teacher.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { employeeId: true }
  });
  
  let nextNum = 1;
  if (lastTeacher?.employeeId) {
    const match = lastTeacher.employeeId.match(/TCH\/\d{4}\/(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}/${year}/${nextNum.toString().padStart(3, '0')}`;
}

export async function generateStaffId(tenantId: string): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  
  const year = new Date().getFullYear();
  const prefix = 'STF';
  
  const lastStaff = await prisma.staff.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { employeeId: true }
  });
  
  let nextNum = 1;
  if (lastStaff?.employeeId) {
    const match = lastStaff.employeeId.match(/STF\/\d{4}\/(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}/${year}/${nextNum.toString().padStart(3, '0')}`;
}