import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { notifications, sendAbsenceAlert, sendFeeReminder, sendResultNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const published = searchParams.get('published');

    const where: any = { tenantId: user.tenantId };
    
    if (type) where.type = type;
    if (published !== null) where.isPublished = published === 'true';

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        tenant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      targetRoles,
      priority,
      publishAt,
      expiresAt,
      isPublished,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        targetRoles: targetRoles || ['ALL'],
        priority: priority || 'NORMAL',
        publishAt: publishAt ? new Date(publishAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPublished: isPublished || false,
        tenantId: user.tenantId,
        createdById: user.userId,
      },
    });

    if (isPublished) {
      await sendAnnouncementNotifications(user.tenantId, announcement, targetRoles);
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendAnnouncementNotifications(
  tenantId: string,
  announcement: any,
  targetRoles?: string[]
) {
  const students = await prisma.student.findMany({
    where: { tenantId, status: 'ACTIVE' },
    include: { parents: true },
  });

  const parentPhones = students
    .flatMap((s) => s.parents)
    .filter((p) => p?.phone)
    .map((p) => p!.phone)
    .filter((phone): phone is string => !!phone);

  const uniquePhones = Array.from(new Set(parentPhones));

  if (uniquePhones.length === 0) return;

  const message = `📢 ${announcement.title}\n\n${announcement.content.substring(0, 300)}${announcement.content.length > 300 ? '...' : ''}`;

  for (const phone of uniquePhones.slice(0, 50)) {
    await notifications.sendWhatsApp(phone, message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing announcement ID' }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...updateData,
        publishAt: updateData.publishAt ? new Date(updateData.publishAt) : undefined,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
      },
    });

    if (updateData.isPublished && !announcement.isPublished) {
      await sendAnnouncementNotifications(user.tenantId, announcement, updateData.targetRoles);
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing announcement ID' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
