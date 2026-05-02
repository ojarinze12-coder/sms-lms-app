import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, brandColor: true, logo: true },
    });

    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

return NextResponse.json({
      settings: {
        schoolName: tenant?.name || '',
        email: config?.smtpFromEmail || '',
        phone: '',
        address: '',
        timezone: config?.timezone || 'Africa/Lagos',
        dateFormat: config?.dateFormat || 'DD/MM/YYYY',
        gradingScale: 'nigerian',
        currency: config?.currency || 'NGN',
        brandColor: tenant?.brandColor || '#1a56db',
        logo: tenant?.logo || '',
        themeMode: settings?.themeMode || 'SYSTEM',
        aiEnabled: settings?.aiEnabled || false,
        openRouterModel: settings?.openRouterModel || 'qwen/qwen3-coder:free',
        allowStudentTransfers: settings?.allowStudentTransfers ?? true,
        requireFeesPaidForTransfer: settings?.requireFeesPaidForTransfer ?? true,
        requireActiveEnrollmentForTransfer: settings?.requireActiveEnrollmentForTransfer ?? true,
        allowStaffTransfers: settings?.allowStaffTransfers ?? true,
        requireFeesPaidForStaffTransfer: settings?.requireFeesPaidForStaffTransfer ?? false,
        transferNotificationsEmail: settings?.transferNotificationsEmail || '',
        promotionEnabled: settings?.promotionEnabled ?? true,
        promotionMinAttendance: settings?.promotionMinAttendance ?? 75,
        promotionAutoEnroll: settings?.promotionAutoEnroll ?? true,
        
        // SMTP Settings
        smtpHost: config?.smtpHost || '',
        smtpPort: config?.smtpPort || 587,
        smtpUser: config?.smtpUser || '',
        smtpFromName: config?.smtpFromName || '',
        smtpSecure: config?.smtpSecure ?? true,
        
        // SMS Settings
        smsProvider: config?.smsProvider || '',
        smsSenderId: config?.smsSenderId || '',
        smsEnvironment: config?.smsEnvironment || '',
        
        // WhatsApp Settings
        whatsappEnabled: config?.whatsappEnabled ?? false,
        whatsappApiUrl: config?.whatsappApiUrl || '',
        whatsappPhoneId: config?.whatsappPhoneId || '',
        
        // Exam Workflow Settings
        examRequiresHodReview: settings?.examRequiresHodReview ?? false,
        examNotifyInApp: settings?.examNotifyInApp ?? true,
        examNotifyEmail: settings?.examNotifyEmail ?? false,
        examNotifySms: settings?.examNotifySms ?? false,
        examNotifyWhatsapp: settings?.examNotifyWhatsapp ?? false,
        examResultsRequirePublish: settings?.examResultsRequirePublish ?? true,
        
        // Bulk Communication
        bulkEmailEnabled: settings?.bulkEmailEnabled ?? true,
        bulkSmsEnabled: settings?.bulkSmsEnabled ?? true,
        bulkWhatsappEnabled: settings?.bulkWhatsappEnabled ?? true,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let authUser;
  try {
    authUser = await getAuthUser();
  } catch (e) {
    return NextResponse.json({ error: 'Auth error: ' + String(e) }, { status: 401 });
  }
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!authUser.tenantId) {
    return NextResponse.json({ error: 'No tenant associated' }, { status: 401 });
  }

  try {
    const tenantId = authUser.tenantId;
    const body = await req.json();
    console.log('[Settings PUT] Body keys:', Object.keys(body));
    const { schoolName, email, phone, address, timezone, dateFormat, gradingScale, currency, brandColor, logo, themeMode, aiEnabled, openRouterApiKey, openRouterModel, 
    // Communication settings
    smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromName, smtpFromEmail, smtpSecure,
    smsProvider, smsApiKey, smsSenderId, smsEnvironment,
    whatsappEnabled, whatsappApiUrl, whatsappApiToken, whatsappPhoneId,
    examRequiresHodReview, examNotifyInApp, examNotifyEmail, examNotifySms, examNotifyWhatsapp, examResultsRequirePublish,
    bulkEmailEnabled, bulkSmsEnabled, bulkWhatsappEnabled,
    } = body;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: schoolName, brandColor, logo },
    });

    await prisma.tenantConfig.upsert({
      where: { tenantId },
      update: {
        smtpFromEmail: email,
        timezone,
        dateFormat,
        currency,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromName,
        smtpFromEmail,
        smtpSecure: smtpSecure ?? true,
        smsProvider,
        smsApiKey,
        smsSenderId,
        smsEnvironment,
        whatsappEnabled,
        whatsappApiUrl,
        whatsappApiToken,
        whatsappPhoneId,
      },
      create: {
        tenantId,
        smtpFromEmail: email,
        timezone,
        dateFormat,
        currency,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromName,
        smtpFromEmail,
        smtpSecure: smtpSecure ?? true,
        smsProvider,
        smsApiKey,
        smsSenderId,
        smsEnvironment,
        whatsappEnabled,
        whatsappApiUrl,
        whatsappApiToken,
        whatsappPhoneId,
      },
    });

    const promotionMinAttendance = Number(body.promotionMinAttendance) || 75;

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        themeMode: themeMode || 'SYSTEM',
        aiEnabled: aiEnabled ?? false,
        openRouterApiKey,
        openRouterModel,
        allowStudentTransfers: body.allowStudentTransfers ?? true,
        requireFeesPaidForTransfer: body.requireFeesPaidForTransfer ?? true,
        requireActiveEnrollmentForTransfer: body.requireActiveEnrollmentForTransfer ?? true,
        allowStaffTransfers: body.allowStaffTransfers ?? true,
        requireFeesPaidForStaffTransfer: body.requireFeesPaidForStaffTransfer ?? false,
        transferNotificationsEmail: body.transferNotificationsEmail || null,
        promotionEnabled: body.promotionEnabled ?? true,
        promotionRequireFeesPaid: body.promotionRequireFeesPaid ?? true,
        promotionMinAttendance,
        promotionAutoEnroll: body.promotionAutoEnroll ?? true,
        // Exam workflow settings
        examRequiresHodReview: examRequiresHodReview ?? false,
        examNotifyInApp: examNotifyInApp ?? true,
        examNotifyEmail: examNotifyEmail ?? false,
        examNotifySms: examNotifySms ?? false,
        examNotifyWhatsapp: examNotifyWhatsapp ?? false,
        examResultsRequirePublish: examResultsRequirePublish ?? true,
        // Bulk communication
        bulkEmailEnabled: bulkEmailEnabled ?? true,
        bulkSmsEnabled: bulkSmsEnabled ?? true,
        bulkWhatsappEnabled: bulkWhatsappEnabled ?? true,
      },
      create: {
        tenantId,
        themeMode: themeMode || 'SYSTEM',
        aiEnabled: aiEnabled ?? false,
        openRouterApiKey,
        openRouterModel,
        allowStudentTransfers: body.allowStudentTransfers ?? true,
        requireFeesPaidForTransfer: body.requireFeesPaidForTransfer ?? true,
        requireActiveEnrollmentForTransfer: body.requireActiveEnrollmentForTransfer ?? true,
        allowStaffTransfers: body.allowStaffTransfers ?? true,
        requireFeesPaidForStaffTransfer: body.requireFeesPaidForStaffTransfer ?? false,
        transferNotificationsEmail: body.transferNotificationsEmail || null,
        promotionEnabled: body.promotionEnabled ?? true,
        promotionRequireFeesPaid: body.promotionRequireFeesPaid ?? true,
        promotionMinAttendance,
        promotionAutoEnroll: body.promotionAutoEnroll ?? true,
        // Exam workflow settings
        examRequiresHodReview: examRequiresHodReview ?? false,
        examNotifyInApp: examNotifyInApp ?? true,
        examNotifyEmail: examNotifyEmail ?? false,
        examNotifySms: examNotifySms ?? false,
        examNotifyWhatsapp: examNotifyWhatsapp ?? false,
        examResultsRequirePublish: examResultsRequirePublish ?? true,
        // Bulk communication
        bulkEmailEnabled: bulkEmailEnabled ?? true,
        bulkSmsEnabled: bulkSmsEnabled ?? true,
        bulkWhatsappEnabled: bulkWhatsappEnabled ?? true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  }
}
