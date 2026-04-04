import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    const virtualClass = await prisma.virtualClass.findFirst({
      where: { id: params.id, tenantId: user.tenantId }
    })

    if (!virtualClass) {
      return NextResponse.json({ error: 'Virtual class not found' }, { status: 404 })
    }

    if (action === 'start') {
      const updated = await prisma.virtualClass.update({
        where: { id: params.id },
        data: {
          status: 'LIVE',
          startedAt: new Date()
        }
      })
      return NextResponse.json(updated)
    }

    if (action === 'end') {
      const updated = await prisma.virtualClass.update({
        where: { id: params.id },
        data: {
          status: 'ENDED',
          endedAt: new Date()
        }
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating virtual class status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
