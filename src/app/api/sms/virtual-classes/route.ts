import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

function generateJitsiRoomName(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'sms-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    const where: any = { tenantId: user.tenantId }

    if (status) where.status = status
    if (classId) where.classId = classId
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.scheduledAt = { gte: startOfDay, lte: endOfDay }
    }

    const virtualClasses = await prisma.virtualClass.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: true,
        _count: { select: { attendances: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    return NextResponse.json(virtualClasses)
  } catch (error) {
    console.error('Error fetching virtual classes:', error)
    return NextResponse.json({ error: 'Failed to fetch virtual classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      subjectId,
      classId,
      teacherId,
      scheduledAt,
      duration,
      isRecurring,
      recurrenceRule,
      notifyStudents,
      notifyParents,
      reminderMinutes,
      allowRecording,
      maxParticipants,
      waitingRoom
    } = body

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId }
    })

    const jitsiDomain = settings?.jitsiDomain || 'meet.jit.si'
    const roomName = generateJitsiRoomName()
    const roomUrl = `https://${jitsiDomain}/${roomName}`
    const hostUrl = `https://${jitsiDomain}/${roomName}?jwt=host`
    const meetingPassword = Math.random().toString(36).substring(2, 8)

    const virtualClass = await prisma.virtualClass.create({
      data: {
        title,
        description,
        subjectId,
        classId,
        teacherId: teacherId || user.id,
        roomName,
        roomUrl,
        hostUrl,
        meetingPassword,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        isRecurring: isRecurring || false,
        recurrenceRule,
        notifyStudents: notifyStudents ?? true,
        notifyParents: notifyParents ?? false,
        reminderMinutes: reminderMinutes || 15,
        allowRecording: allowRecording ?? true,
        maxParticipants: maxParticipants || 100,
        waitingRoom: waitingRoom ?? false,
        tenantId: user.tenantId,
        createdById: user.id,
        status: 'SCHEDULED'
      }
    })

    return NextResponse.json(virtualClass, { status: 201 })
  } catch (error) {
    console.error('Error creating virtual class:', error)
    return NextResponse.json({ error: 'Failed to create virtual class' }, { status: 500 })
  }
}
