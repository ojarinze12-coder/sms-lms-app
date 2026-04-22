import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, hashPassword } from '@/lib/auth';
import { TIER_TEMPLATES } from '@/lib/constants/tiers';
import { DEFAULT_SSS_DEPARTMENTS } from '@/lib/constants/departments';
import type { Curriculum } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      schoolName, 
      slug, 
      email, 
      password, 
      firstName, 
      lastName, 
      brandColor, 
      logo,
      tierTemplate,
      curriculum = 'NERDC',
      usePerTierCurriculum = false,
      themeMode = 'SYSTEM',
    } = body;

    console.log('Registration attempt:', { schoolName, slug, email, firstName, lastName, brandColor, tierTemplate, curriculum });

    if (!schoolName || !slug || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!tierTemplate || !TIER_TEMPLATES[tierTemplate as keyof typeof TIER_TEMPLATES]) {
      return NextResponse.json(
        { error: 'Please select a school tier template' },
        { status: 400 }
      );
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    console.log('Attempting to create tenant...');
    
    const tenant = await prisma.tenant.create({
      data: {
        name: schoolName,
        slug,
        plan: 'FREE',
        brandColor: brandColor || '#1a56db',
        logo: logo || null,
        status: 'ACTIVE',
      },
    });

    console.log('Tenant created successfully:', tenant.id);

    // Create tiers from template
    const template = TIER_TEMPLATES[tierTemplate as keyof typeof TIER_TEMPLATES];
    console.log('Creating tiers from template:', tierTemplate);
    
    const createdTiers = await Promise.all(
      template.map(async (tier) => {
        return prisma.tier.create({
          data: {
            name: tier.name,
            code: tier.code,
            order: tier.order,
            tenantId: tenant.id,
          },
        });
      })
    );

    console.log('Created tiers:', createdTiers.map(t => t.name));

    // Create tenant settings with curriculum
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        curriculumType: curriculum as Curriculum,
        usePerTierCurriculum,
        tiersSetupComplete: true,
        themeMode,
      },
    });

    // Create tier curriculum for each tier
    await Promise.all(
      createdTiers.map((tier) =>
        prisma.tierCurriculum.create({
          data: {
            tierId: tier.id,
            curriculum: curriculum as Curriculum,
            tenantId: tenant.id,
          },
        })
      )
    );

    // Create default SSS departments if SSS tier exists
    const sssTier = createdTiers.find(t => t.code === 'SSS');
    if (sssTier) {
      console.log('Creating default SSS departments...');
      
      const createdDepts = await Promise.all(
        DEFAULT_SSS_DEPARTMENTS.map(async (dept) => {
          const department = await prisma.department.create({
            data: {
              name: dept.name,
              code: dept.code,
              tierId: sssTier.id,
              tenantId: tenant.id,
            },
          });

          // Create subjects for the department
          await Promise.all(
            dept.subjects.map(async (subjectName, index) => {
              const code = subjectName.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
              await prisma.subject.create({
                data: {
                  name: subjectName,
                  code: `${dept.code}_${index + 1}`,
                  departmentId: department.id,
                  curriculum: curriculum as Curriculum,
                },
              });
            })
          );

          return department;
        })
      );

      console.log('Created departments:', createdDepts.map(d => d.name));
    }

    console.log('Attempting to create admin user...');
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        firstName,
        lastName,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });

    console.log('User created successfully:', user.id);

    const token = createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId || undefined,
      branchId: user.branchId || undefined,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: tenant,
      },
    });

    response.cookies.set('pcc-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('scc-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('scc-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
