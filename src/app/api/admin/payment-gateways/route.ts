import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-server';
import { encrypt, decrypt } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authUser = await requireSuperAdmin();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get platform settings from database first, fallback to env vars
    let platformSettings = await prisma.platformSettings.findUnique({
      where: { id: 'platform' },
    });

    // If no database settings, use env vars
    if (!platformSettings) {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
      const remitaConfigured = !!(process.env.REMITA_MERCHANT_ID && process.env.REMITA_API_KEY);

      return NextResponse.json({
        paymentGateway: process.env.DEFAULT_PAYMENT_GATEWAY || 'PAYSTACK',
        paystackConfigured: !!paystackKey,
        flutterwaveConfigured: !!flutterwaveKey,
        remitaConfigured,
        paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ? process.env.PAYSTACK_PUBLIC_KEY.slice(0, 8) + '***' : null,
        flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY ? process.env.FLUTTERWAVE_PUBLIC_KEY.slice(0, 8) + '***' : null,
        remitaMerchantId: process.env.REMITA_MERCHANT_ID ? process.env.REMITA_MERCHANT_ID.slice(0, 4) + '***' : null,
        remitaServiceTypeId: process.env.REMITA_SERVICE_TYPE_ID || null,
        environment: process.env.NODE_ENV || 'development',
        source: 'env',
      });
    }

    // Return database config (with masked sensitive fields)
    return NextResponse.json({
      paymentGatewayEnabled: platformSettings.paymentGatewayEnabled || false,
      paymentGateway: platformSettings.paymentGateway || 'PAYSTACK',
      paystackConfigured: !!platformSettings.paystackSecretKey,
      flutterwaveConfigured: !!platformSettings.flutterwaveSecretKey,
      remitaConfigured: !!(platformSettings.remitaMerchantId && platformSettings.remitaApiKey),
      paystackPublicKey: platformSettings.paystackPublicKey ? platformSettings.paystackPublicKey.slice(0, 8) + '***' : null,
      flutterwavePublicKey: platformSettings.flutterwavePublicKey ? platformSettings.flutterwavePublicKey.slice(0, 8) + '***' : null,
      paystackWebhookSecret: platformSettings.paystackWebhookSecret ? '***configured***' : null,
      flutterwaveWebhookSecret: platformSettings.flutterwaveWebhookSecret ? '***configured***' : null,
      demoMode: platformSettings.demoMode || false,
      remitaMerchantId: platformSettings.remitaMerchantId ? platformSettings.remitaMerchantId.slice(0, 4) + '***' : null,
      remitaServiceTypeId: platformSettings.remitaServiceTypeId || null,
      environment: process.env.NODE_ENV || 'development',
      source: 'database',
    });
  } catch (error: any) {
    console.error('Error fetching platform payment settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      paymentGatewayEnabled,
      paymentGateway,
      paystackSecretKey,
      paystackPublicKey,
      paystackWebhookSecret,
      flutterwaveSecretKey,
      flutterwavePublicKey,
      flutterwaveWebhookSecret,
      demoMode,
      remitaMerchantId,
      remitaApiKey,
      remitaServiceTypeId,
    } = body;

    const updateData: any = {
      paymentGateway: paymentGateway || 'PAYSTACK',
    };

    if (paymentGatewayEnabled !== undefined) {
      updateData.paymentGatewayEnabled = paymentGatewayEnabled;
    }
    if (paystackSecretKey) {
      updateData.paystackSecretKey = encrypt(paystackSecretKey);
    }
    if (paystackPublicKey) {
      updateData.paystackPublicKey = paystackPublicKey;
    }
    if (paystackWebhookSecret) {
      updateData.paystackWebhookSecret = encrypt(paystackWebhookSecret);
    }
    if (flutterwaveSecretKey) {
      updateData.flutterwaveSecretKey = encrypt(flutterwaveSecretKey);
    }
    if (flutterwavePublicKey) {
      updateData.flutterwavePublicKey = flutterwavePublicKey;
    }
    if (flutterwaveWebhookSecret) {
      updateData.flutterwaveWebhookSecret = encrypt(flutterwaveWebhookSecret);
    }
    if (demoMode !== undefined) {
      updateData.demoMode = demoMode;
    }
    if (remitaMerchantId) {
      updateData.remitaMerchantId = remitaMerchantId;
    }
    if (remitaApiKey) {
      updateData.remitaApiKey = encrypt(remitaApiKey);
    }
    if (remitaServiceTypeId) {
      updateData.remitaServiceTypeId = remitaServiceTypeId;
    }

    const platformSettings = await prisma.platformSettings.upsert({
      where: { id: 'platform' },
      update: updateData,
      create: {
        id: 'platform',
        paymentGateway: paymentGateway || 'PAYSTACK',
        paystackSecretKey: paystackSecretKey ? encrypt(paystackSecretKey) : null,
        paystackPublicKey: paystackPublicKey || null,
        flutterwaveSecretKey: flutterwaveSecretKey ? encrypt(flutterwaveSecretKey) : null,
        flutterwavePublicKey: flutterwavePublicKey || null,
        remitaMerchantId: remitaMerchantId || null,
        remitaApiKey: remitaApiKey ? encrypt(remitaApiKey) : null,
        remitaServiceTypeId: remitaServiceTypeId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Platform payment settings updated',
      paymentGateway: platformSettings.paymentGateway,
      paystackConfigured: !!platformSettings.paystackSecretKey,
      flutterwaveConfigured: !!platformSettings.flutterwaveSecretKey,
    });
  } catch (error: any) {
    console.error('Error updating platform payment settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}