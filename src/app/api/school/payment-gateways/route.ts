import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { encrypt, decrypt } from '@/lib/security';

export async function GET() {
  const authUser = await getAuthUser();
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: {
        paymentGatewayEnabled: true,
        paymentGateway: true,
        paymentGatewaySecretKey: true,
        paymentGatewayPublicKey: true,
        paymentGatewayWebhookSecret: true,
        paymentDemoMode: true,
        remitaEnabled: true,
        remitaMerchantId: true,
        remitaApiKey: true,
        remitaServiceTypeId: true,
        remitaEnvironment: true,
      }
    });

    if (!settings) {
      return NextResponse.json({
        paymentGatewayEnabled: false,
        paymentGateway: null,
        paymentGatewayPublicKey: null,
        paymentDemoMode: false,
        remitaEnabled: false,
        remitaMerchantId: null,
        remitaServiceTypeId: null,
        remitaEnvironment: null,
        paymentGatewaySecretKey: null,
        remitaApiKey: null,
      });
    }

    return NextResponse.json({
      paymentGatewayEnabled: settings.paymentGatewayEnabled || false,
      paymentGateway: settings.paymentGateway || null,
      paymentGatewaySecretKey: settings.paymentGatewaySecretKey ? '***configured***' : null,
      paymentGatewayPublicKey: settings.paymentGatewayPublicKey || null,
      paymentGatewayWebhookSecret: settings.paymentGatewayWebhookSecret ? '***configured***' : null,
      paymentDemoMode: settings.paymentDemoMode || false,
      remitaEnabled: settings.remitaEnabled || false,
      remitaMerchantId: settings.remitaMerchantId || null,
      remitaApiKey: settings.remitaApiKey ? '***configured***' : null,
      remitaServiceTypeId: settings.remitaServiceTypeId || null,
      remitaEnvironment: settings.remitaEnvironment || 'DEMO',
    });
  } catch (error: any) {
    console.error('Error fetching payment gateway settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const {
      paymentGatewayEnabled,
      paymentGateway,
      paymentGatewaySecretKey,
      paymentGatewayPublicKey,
      paymentGatewayWebhookSecret,
      paymentDemoMode,
      remitaEnabled,
      remitaMerchantId,
      remitaApiKey,
      remitaServiceTypeId,
      remitaEnvironment,
    } = body;

    const updateData: any = {};

    // Payment Gateway (School Fees)
    if (paymentGatewayEnabled !== undefined) {
      updateData.paymentGatewayEnabled = paymentGatewayEnabled;
    }
    if (paymentGateway) {
      updateData.paymentGateway = paymentGateway;
    }
    if (paymentGatewaySecretKey) {
      updateData.paymentGatewaySecretKey = encrypt(paymentGatewaySecretKey);
    }
    if (paymentGatewayPublicKey) {
      updateData.paymentGatewayPublicKey = paymentGatewayPublicKey;
    }
    if (paymentGatewayWebhookSecret) {
      updateData.paymentGatewayWebhookSecret = encrypt(paymentGatewayWebhookSecret);
    }
    if (paymentDemoMode !== undefined) {
      updateData.paymentDemoMode = paymentDemoMode;
    }

    // Remita (Payroll)
    if (remitaEnabled !== undefined) {
      updateData.remitaEnabled = remitaEnabled;
    }
    if (remitaMerchantId !== undefined) {
      updateData.remitaMerchantId = remitaMerchantId;
    }
    if (remitaApiKey) {
      updateData.remitaApiKey = encrypt(remitaApiKey);
    }
    if (remitaServiceTypeId !== undefined) {
      updateData.remitaServiceTypeId = remitaServiceTypeId;
    }
    if (remitaEnvironment) {
      updateData.remitaEnvironment = remitaEnvironment;
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: authUser.tenantId },
      update: updateData,
      create: {
        tenantId: authUser.tenantId,
        ...updateData,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Payment gateway settings updated successfully',
      data: {
        paymentGatewayEnabled: settings.paymentGatewayEnabled,
        paymentGateway: settings.paymentGateway,
        paymentGatewayPublicKey: settings.paymentGatewayPublicKey ? '***configured***' : null,
        remitaEnabled: settings.remitaEnabled,
        remitaMerchantId: settings.remitaMerchantId,
        remitaServiceTypeId: settings.remitaServiceTypeId,
        remitaEnvironment: settings.remitaEnvironment,
      }
    });
  } catch (error: any) {
    console.error('Error updating payment gateway settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}