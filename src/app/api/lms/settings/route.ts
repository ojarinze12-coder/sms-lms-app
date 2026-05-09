import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  examTimeLimit: z.number().min(1).max(300).default(60),
  passingScore: z.number().min(0).max(100).default(50),
  allowLateSubmission: z.boolean().default(true),
  latePenaltyPercent: z.number().min(0).max(100).default(10),
});

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: {
        examTimeLimit: true,
        passingScore: true,
        allowLateSubmission: true,
        latePenaltyPercent: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching LMS settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = settingsSchema.parse(body);

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: authUser.tenantId },
      update: {
        examTimeLimit: validated.examTimeLimit,
        passingScore: validated.passingScore,
        allowLateSubmission: validated.allowLateSubmission,
        latePenaltyPercent: validated.latePenaltyPercent,
      },
      create: {
        tenantId: authUser.tenantId,
        examTimeLimit: validated.examTimeLimit,
        passingScore: validated.passingScore,
        allowLateSubmission: validated.allowLateSubmission,
        latePenaltyPercent: validated.latePenaltyPercent,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error saving LMS settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}