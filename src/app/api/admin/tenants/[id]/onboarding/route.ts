import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updateTaskSchema = z.object({
  taskKey: z.string(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const tasks = await prisma.onboardingTask.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'asc' },
    });

    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const totalProgress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
      : 0;

    return NextResponse.json({
      tasks,
      summary: {
        total: tasks.length,
        completed: completedCount,
        progress: totalProgress,
      },
    });
  } catch (error) {
    console.error('Admin Tenant Onboarding GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const task = await prisma.onboardingTask.upsert({
      where: {
        tenantId_taskKey: {
          tenantId: id,
          taskKey: validatedData.taskKey as any,
        },
      },
      update: {
        progress: validatedData.progress,
        status: validatedData.status,
        completedAt: validatedData.status === 'COMPLETED' ? new Date() : undefined,
      },
      create: {
        tenantId: id,
        taskKey: validatedData.taskKey as any,
        title: validatedData.taskKey,
        progress: validatedData.progress || 0,
        status: validatedData.status || 'PENDING',
      },
    });

    const allTasks = await prisma.onboardingTask.findMany({
      where: { tenantId: id },
    });

    const totalProgress = allTasks.length > 0
      ? Math.round(allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length)
      : 0;

    return NextResponse.json({ 
      task,
      overallProgress: totalProgress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant Onboarding PUT error:', error);
    return NextResponse.json({ error: 'Failed to update onboarding task' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, taskKey, progress, status } = body;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (action === 'bulk-update') {
      const updates = await Promise.all(
        (body.tasks || []).map(async (t: any) => {
          return prisma.onboardingTask.upsert({
            where: {
              tenantId_taskKey: {
                tenantId: id,
                taskKey: t.taskKey,
              },
            },
            update: {
              progress: t.progress,
              status: t.status,
              completedAt: t.status === 'COMPLETED' ? new Date() : undefined,
            },
            create: {
              tenantId: id,
              taskKey: t.taskKey as any,
              title: t.taskKey,
              progress: t.progress,
              status: t.status,
              completedAt: t.status === 'COMPLETED' ? new Date() : undefined,
            },
          });
        })
      );

      return NextResponse.json({ tasks: updates });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Tenant Onboarding POST error:', error);
    return NextResponse.json({ error: 'Failed to update onboarding' }, { status: 500 });
  }
}
