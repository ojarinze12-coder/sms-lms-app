import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

const DEFAULT_REPORT_TEMPLATES = [
  {
    name: 'Student Enrollment Summary',
    description: 'Total students enrolled by class, gender, and tier',
    category: 'ENROLLMENT',
    isRegulatory: true,
    regulatoryBody: 'MINISTRY_OF_EDUCATION',
    config: {
      sections: [
        { title: 'Overview', fields: ['totalStudents', 'byClass', 'byGender', 'byTier'] },
        { title: 'Class Breakdown', type: 'table', dataSource: 'classes' }
      ],
      filters: ['academicYear', 'term'],
      columns: ['className', 'male', 'female', 'total']
    }
  },
  {
    name: 'Staff Directory',
    description: 'Complete list of all staff with qualifications',
    category: 'STAFF',
    isRegulatory: true,
    regulatoryBody: 'MINISTRY_OF_EDUCATION',
    config: {
      sections: [
        { title: 'Staff List', type: 'table', dataSource: 'staff' }
      ],
      filters: ['category', 'employmentType'],
      columns: ['name', 'employeeId', 'category', 'qualification', 'phone']
    }
  },
  {
    name: 'School Facilities',
    description: 'Report on classrooms, laboratories, libraries, and amenities',
    category: 'REGULATORY',
    isRegulatory: true,
    regulatoryBody: 'MINISTRY_OF_EDUCATION',
    config: {
      sections: [
        { title: 'Infrastructure', fields: ['classrooms', 'laboratories', 'libraries', 'hostels'] },
        { title: 'Amenities', fields: ['electricity', 'water', 'internet', 'transport'] }
      ]
    }
  },
  {
    name: 'WAEC Registration List',
    description: 'SS3 students registered for WAEC external examinations',
    category: 'REGULATORY',
    isRegulatory: true,
    regulatoryBody: 'WAEC',
    config: {
      sections: [
        { title: 'Candidates', type: 'table', dataSource: 'students' }
      ],
      filters: ['academicYear', 'class'],
      columns: ['studentId', 'firstName', 'lastName', 'jambRegNo', 'gender']
    }
  },
  {
    name: 'NECO Registration List',
    description: 'SS3 students registered for NECO external examinations',
    category: 'REGULATORY',
    isRegulatory: true,
    regulatoryBody: 'NECO',
    config: {
      sections: [
        { title: 'Candidates', type: 'table', dataSource: 'students' }
      ],
      filters: ['academicYear', 'class'],
      columns: ['studentId', 'firstName', 'lastName', 'gender']
    }
  },
  {
    name: 'Daily Attendance Report',
    description: 'Student attendance by class for a specific date',
    category: 'ATTENDANCE',
    config: {
      sections: [
        { title: 'Attendance Summary', type: 'table', dataSource: 'attendance' }
      ],
      filters: ['date', 'class'],
      columns: ['studentName', 'status', 'remarks']
    }
  },
  {
    name: 'Fee Collection Report',
    description: 'Fee payment status by class and academic term',
    category: 'FINANCE',
    config: {
      sections: [
        { title: 'Collection Summary', fields: ['totalExpected', 'totalCollected', 'balance'] },
        { title: 'By Class', type: 'table', dataSource: 'feePayments' }
      ],
      filters: ['academicYear', 'term'],
      columns: ['className', 'expected', 'collected', 'percentage']
    }
  },
  {
    name: 'Academic Performance Report',
    description: 'Student grades and performance by subject',
    category: 'ACADEMIC',
    config: {
      sections: [
        { title: 'Subject Performance', type: 'table', dataSource: 'results' }
      ],
      filters: ['academicYear', 'term', 'class', 'subject'],
      columns: ['studentName', 'ca1', 'ca2', 'exam', 'total', 'grade']
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const regulatory = searchParams.get('regulatory')

    const where: any = {
      OR: [
        { tenantId: user.tenantId },
        { isGlobal: true }
      ]
    }

    if (category) where.category = category
    if (regulatory === 'true') where.isRegulatory = true

    let templates = await prisma.reportTemplate.findMany({
      where,
      orderBy: [{ isRegulatory: 'desc' }, { name: 'asc' }]
    })

    // If no templates exist, create default templates
    if (templates.length === 0) {
      // Create default templates for the tenant
      for (const template of DEFAULT_REPORT_TEMPLATES) {
        await prisma.reportTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            category: template.category,
            isRegulatory: template.isRegulatory,
            regulatoryBody: template.regulatoryBody,
            config: template.config,
            tenantId: user.tenantId,
            createdById: user.id
          }
        })
      }
      // Fetch again after creation
      templates = await prisma.reportTemplate.findMany({
        where,
        orderBy: [{ isRegulatory: 'desc' }, { name: 'asc' }]
      })
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, config, isRegulatory, regulatoryBody } = body

    const template = await prisma.reportTemplate.create({
      data: {
        name,
        description,
        category,
        config: config || {},
        isRegulatory: isRegulatory || false,
        regulatoryBody,
        tenantId: user.tenantId,
        createdById: user.id
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
