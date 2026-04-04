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
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        participantId: user.id
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const where: any = { conversationId }
    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content, type, attachmentUrl, replyToId } = body

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        participantId: user.id
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        senderType: user.role === 'PARENT' ? 'PARENT' : 'USER',
        content,
      }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
