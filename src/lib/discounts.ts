import { prisma } from '@/lib/prisma';

interface DiscountResult {
  componentId: string;
  originalAmount: number;
  totalDiscountPercent: number;
  discountAmount: number;
  finalAmount: number;
  appliedDiscounts: Array<{
    typeName: string;
    typeCode: string;
    percentage: number;
    category: 'SIBLING' | 'SCHOLARSHIP' | 'OTHER';
  }>;
}

interface ComponentInfo {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number;
}

function getSiblingDiscountRate(siblingCount: number, config: any): number {
  if (siblingCount < 2) return 0;
  switch (siblingCount) {
    case 2: return config.secondChildDiscount;
    case 3: return config.thirdChildDiscount;
    case 4: return config.fourthChildDiscount;
    case 5: return config.fifthChildDiscount;
    default: return config.fifthChildDiscount;
  }
}

async function getApplicableSiblingDiscount(
  studentId: string,
  academicYearId: string,
  tenantId: string,
  config: any
): Promise<number> {
  if (!config?.isEnabled || config.secondChildDiscount === 0) return 0;

  const parentStudents = await prisma.parentStudent.findMany({
    where: {
      student: {
        tenantId,
        enrollments: { some: { academicClass: { academicYearId } } },
      },
    },
    select: { parentId: true },
  });

  const parentIds = [...new Set<string>(parentStudents.map(p => p.parentId))];

  const siblingCount = await prisma.student.count({
    where: {
      tenantId,
      parentStudents: { some: { parentId: { in: parentIds } } },
      enrollments: { some: { academicClass: { academicYearId } } },
    },
  });

  if (siblingCount < 2) return 0;

  const rate = getSiblingDiscountRate(siblingCount, config);
  return Math.min(rate, config.maxDiscountPerChild || 50);
}

export async function calculateDiscounts(
  studentId: string,
  academicYearId: string,
  tenantId: string,
  components: ComponentInfo[]
): Promise<Map<string, DiscountResult>> {
  const results = new Map<string, DiscountResult>();

  const [siblingDiscountConfig, studentDiscounts] = await Promise.all([
    prisma.siblingDiscount.findFirst({
      where: {
        tenantId,
        OR: [{ academicYearId }, { academicYearId: null }],
      },
      orderBy: { academicYearId: 'desc' },
    }),
    prisma.studentDiscount.findMany({
      where: {
        studentId,
        academicYearId,
        status: 'APPROVED',
      },
      include: { discountType: true },
    }),
  ]);

  let siblingDiscountRate = 0;
  if (siblingDiscountConfig?.isEnabled) {
    siblingDiscountRate = await getApplicableSiblingDiscount(studentId, academicYearId, tenantId, siblingDiscountConfig);
  }

  for (const component of components) {
    if (component.category === 'OPTIONAL') {
      results.set(component.id, {
        componentId: component.id,
        originalAmount: component.amount,
        totalDiscountPercent: 0,
        discountAmount: 0,
        finalAmount: component.amount,
        appliedDiscounts: [],
      });
      continue;
    }

    const isTuition = component.type === 'TUITION';
    const applicableDiscounts: DiscountResult['appliedDiscounts'] = [];
    let totalDiscountPercent = 0;

    if (siblingDiscountRate > 0) {
      const applies =
        siblingDiscountConfig?.applyTo === 'ALL' ||
        (siblingDiscountConfig?.applyTo === 'MANDATORY_ONLY' && component.category === 'MANDATORY') ||
        (siblingDiscountConfig?.applyTo === 'TUITION_ONLY' && isTuition);

      if (applies) {
        totalDiscountPercent += siblingDiscountRate;
        applicableDiscounts.push({
          typeName: 'Sibling Discount',
          typeCode: 'SIBLING',
          percentage: siblingDiscountRate,
          category: 'SIBLING',
        });
      }
    }

    for (const sd of studentDiscounts) {
      const applies =
        sd.discountType.appliesTo === 'ALL' ||
        (sd.discountType.appliesTo === 'MANDATORY_ONLY' && component.category === 'MANDATORY') ||
        (sd.discountType.appliesTo === 'TUITION_ONLY' && isTuition);

      if (applies) {
        const pct = Math.min(sd.discountPercentage, sd.discountType.maxDiscountPerStudent || 50);
        totalDiscountPercent += pct;
        applicableDiscounts.push({
          typeName: sd.discountType.name,
          typeCode: sd.discountType.code,
          percentage: pct,
          category: 'OTHER',
        });
      }
    }

    totalDiscountPercent = Math.min(totalDiscountPercent, 50);

    const discountAmount = component.amount * (totalDiscountPercent / 100);
    const finalAmount = component.amount - discountAmount;

    results.set(component.id, {
      componentId: component.id,
      originalAmount: component.amount,
      totalDiscountPercent,
      discountAmount,
      finalAmount,
      appliedDiscounts: applicableDiscounts,
    });
  }

  return results;
}