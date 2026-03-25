import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

const AVAILABLE_MODULES = [
  { key: 'online_fees', name: 'Online Fees Payment', description: 'Allow parents to pay fees online via Paystack/Flutterwave' },
  { key: 'transport', name: 'Transport Management', description: 'Manage school buses and routes' },
  { key: 'library', name: 'Library Management', description: 'Book circulation and library tracking' },
  { key: 'hostel', name: 'Hostel Management', description: 'Manage student accommodation' },
  { key: 'ai_timetable', name: 'AI Timetable Generator', description: 'Auto-generate class timetables using AI' },
  { key: 'ai_exam', name: 'AI Exam Generator', description: 'Generate exam questions using AI' },
  { key: 'sms_notifications', name: 'SMS Notifications', description: 'Send SMS alerts to parents' },
  { key: 'whatsapp_notifications', name: 'WhatsApp Notifications', description: 'Send WhatsApp messages' },
  { key: 'online_admissions', name: 'Online Admissions', description: 'Digital application and enrollment' },
  { key: 'parent_portal', name: 'Parent Portal', description: 'Allow parents to access student data' },
  { key: 'student_portal', name: 'Student Portal', description: 'Student self-service portal' },
  { key: 'mobile_app', name: 'Mobile App', description: 'Access via mobile application' },
  { key: 'live_classes', name: 'Virtual Classrooms', description: 'Live video classes integration' },
  { key: 'discussion_forums', name: 'Discussion Forums', description: 'Course discussion boards' },
  { key: 'badges_certificates', name: 'Badges & Certificates', description: 'Gamification and awards' },
  { key: 'inventory', name: 'Asset Management', description: 'Track school equipment' },
];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;

    const dbModules = await prisma.tenantModule.findMany({
      where: { tenantId },
    });

    const modules = AVAILABLE_MODULES.map(mod => {
      const dbMod = dbModules.find(m => m.moduleKey === mod.key);
      return {
        key: mod.key,
        name: mod.name,
        description: mod.description,
        enabled: dbMod?.enabled ?? false,
        category: getCategory(mod.key),
      };
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const body = await req.json();
    const { moduleKey, enabled } = body;

    if (!moduleKey || enabled === undefined) {
      return NextResponse.json({ error: 'moduleKey and enabled are required' }, { status: 400 });
    }

    const mod = AVAILABLE_MODULES.find(m => m.key === moduleKey);
    if (!mod) {
      return NextResponse.json({ error: 'Invalid module key' }, { status: 400 });
    }

    const tenantModule = await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
      update: { enabled },
      create: {
        tenantId,
        moduleKey,
        name: mod.name,
        description: mod.description,
        enabled,
      },
    });

    return NextResponse.json({ module: tenantModule });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

function getCategory(key: string): string {
  const categories: Record<string, string> = {
    online_fees: 'Finance',
    transport: 'Logistics',
    library: 'Academics',
    hostel: 'Logistics',
    ai_timetable: 'AI Features',
    ai_exam: 'AI Features',
    sms_notifications: 'Communication',
    whatsapp_notifications: 'Communication',
    online_admissions: 'Admissions',
    parent_portal: 'Portals',
    student_portal: 'Portals',
    mobile_app: 'Portals',
    live_classes: 'LMS',
    discussion_forums: 'LMS',
    badges_certificates: 'LMS',
    inventory: 'Logistics',
  };
  return categories[key] || 'Other';
}
