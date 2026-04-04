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

    const resources = await prisma.lessonResource.findMany({
      where: { lessonId: params.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching lesson resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, url, size, mimeType, duration, isExternal } = body

    const resource = await prisma.lessonResource.create({
      data: {
        lessonId: params.id,
        name,
        type,
        url,
        size,
        mimeType,
        duration,
        isExternal: isExternal || false,
        tenantId: user.tenantId
      }
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
