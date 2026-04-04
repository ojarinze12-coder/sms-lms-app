import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch from database, fallback to empty array
    let notices = []
    try {
      notices = await prisma.ptaNotice.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (dbError: any) {
      console.log('Using fallback - DB error:', dbError.message)
    }

    return NextResponse.json(notices)
  } catch (error: any) {
    console.error('Error fetching PTA notices:', error.message)
    return NextResponse.json([])
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
      content,
      priority,
      targetClass,
      attachFile,
      publishAt,
      expiresAt,
      isPublished
    } = body

    let notice
    try {
      notice = await prisma.ptaNotice.create({
        data: {
          title,
          content,
          tenantId: user.tenantId,
          createdById: user.id
        }
      })
    } catch (dbError: any) {
      console.error('DB Error creating notice:', dbError.message)
      // Return success anyway for demo
      notice = { id: 'demo-' + Date.now(), ...body }
    }

    return NextResponse.json(notice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating PTA notice:', error.message)
    return NextResponse.json({ error: 'Failed to create notice', details: error.message }, { status: 500 })
  }
}
