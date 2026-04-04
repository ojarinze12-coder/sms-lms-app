import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const classId = searchParams.get('classId')

    const participantConversations = await prisma.conversationParticipant.findMany({
      where: {
        participantId: user.id
      },
      select: { conversationId: true }
    })

    const conversationIds = participantConversations.map(p => p.conversationId)

    const where: any = {
      id: { in: conversationIds },
      tenantId: user.tenantId
    }

    if (type) where.type = type
    if (classId) where.classId = classId

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, subjectId, classId, participantIds } = body

    const conversation = await prisma.conversation.create({
      data: {
        type: type || 'DIRECT',
        tenantId: user.tenantId
      }
    })

    const participants = [
      { participantId: user.id, participantType: user.role === 'PARENT' ? 'PARENT' : 'USER', role: 'ADMIN' },
      ...(participantIds || []).map((p: string) => ({ participantId: p, participantType: 'USER', role: 'MEMBER' }))
    ]

    await prisma.conversationParticipant.createMany({
      data: participants.map(p => ({
        conversationId: conversation.id,
        participantId: p.participantId,
        participantType: p.participantType,
        role: p.role
      }))
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
