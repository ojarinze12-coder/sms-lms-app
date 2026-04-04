import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const applicationSettingsSchema = z.object({
  applicationsEnabled: z.boolean().optional(),
  applicationFee: z.number().optional(),
  applicationPaymentGateway: z.string().nullable().optional(),
  requireEntranceExam: z.boolean().optional(),
  entranceExamThreshold: z.number().optional(),
  requireInterview: z.boolean().optional(),
  requireDocuments: z.boolean().optional(),
  requiredDocumentTypes: z.array(z.string()).optional(),
  autoEnrollClasses: z.array(z.string()).optional(),
  applicationDeadline: z.string().nullable().optional(),
  allowParentRegistration: z.boolean().optional(),
  sendWelcomeEmail: z.boolean().optional(),
  tierRequirements: z.record(z.object({
    requireEntranceExam: z.boolean().optional(),
    requireInterview: z.boolean().optional(),
    requireDocuments: z.boolean().optional(),
    requiredDocumentTypes: z.array(z.string()).optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return NextResponse.json({
      applicationsEnabled: settings?.applicationsEnabled ?? false,
      applicationFee: settings?.applicationFee ?? 0,
      applicationPaymentGateway: settings?.applicationPaymentGateway ?? null,
      requireEntranceExam: settings?.requireEntranceExam ?? false,
      entranceExamThreshold: settings?.entranceExamThreshold ?? 50,
      requireInterview: settings?.requireInterview ?? false,
      requireDocuments: settings?.requireDocuments ?? false,
      requiredDocumentTypes: settings?.requiredDocumentTypes ?? [],
      autoEnrollClasses: settings?.autoEnrollClasses ?? [],
      applicationDeadline: settings?.applicationDeadline,
      allowParentRegistration: settings?.allowParentRegistration ?? true,
      sendWelcomeEmail: settings?.sendWelcomeEmail ?? true,
      tierRequirements: (settings as any).tierRequirements ?? {},
    });
  } catch (error) {
    console.error('Application settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const data = applicationSettingsSchema.parse(body);

    const { tierRequirements, tiers, ...validData } = data;

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: validData,
      create: {
        tenantId,
        ...validData,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        applicationsEnabled: settings.applicationsEnabled,
        applicationFee: settings.applicationFee,
        applicationPaymentGateway: settings.applicationPaymentGateway,
        requireEntranceExam: settings.requireEntranceExam,
        requireInterview: settings.requireInterview,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Application settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}