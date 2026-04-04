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
    const status = searchParams.get('status')
    const templateId = searchParams.get('templateId')

    const where: any = { tenantId: user.tenantId }
    if (status) where.status = status
    if (templateId) where.templateId = templateId

    const generations = await prisma.reportGeneration.findMany({
      where,
      include: { template: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(generations)
  } catch (error) {
    console.error('Error fetching report generations:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, parameters, format, scheduledFor } = body

    const template = await prisma.reportTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ tenantId: user.tenantId }, { isGlobal: true }]
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const generation = await prisma.reportGeneration.create({
      data: {
        templateId,
        parameters: parameters || {},
        format: format || 'PDF',
        status: scheduledFor ? 'PENDING' : 'GENERATING',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        tenantId: user.tenantId,
        generatedById: user.id
      }
    })

    await prisma.reportTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    })

    return NextResponse.json(generation, { status: 201 })
  } catch (error) {
    console.error('Error creating report generation:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
