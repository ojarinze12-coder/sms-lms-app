import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const virtualClass = await prisma.virtualClass.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
      include: {
        class: true,
        subject: true,
        teacher: true,
        attendances: {
          include: { student: true }
        }
      }
    })

    if (!virtualClass) {
      return NextResponse.json({ error: 'Virtual class not found' }, { status: 404 })
    }

    return NextResponse.json(virtualClass)
  } catch (error) {
    console.error('Error fetching virtual class:', error)
    return NextResponse.json({ error: 'Failed to fetch virtual class' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const existing = await prisma.virtualClass.findFirst({
      where: { id: params.id, tenantId: user.tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Virtual class not found' }, { status: 404 })
    }

    const virtualClass = await prisma.virtualClass.update({
      where: { id: params.id },
      data: {
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
      }
    })

    return NextResponse.json(virtualClass)
  } catch (error) {
    console.error('Error updating virtual class:', error)
    return NextResponse.json({ error: 'Failed to update virtual class' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.virtualClass.findFirst({
      where: { id: params.id, tenantId: user.tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Virtual class not found' }, { status: 404 })
    }

    await prisma.virtualClass.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Virtual class deleted' })
  } catch (error) {
    console.error('Error deleting virtual class:', error)
    return NextResponse.json({ error: 'Failed to delete virtual class' }, { status: 500 })
  }
}
