import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PaystackService } from '@/lib/paystack';
import { FlutterwaveService } from '@/lib/flutterwave';
import { decrypt } from '@/lib/security';

const initializePaymentSchema = z.object({
  applicationId: z.string().uuid(),
  gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, gateway } = initializePaymentSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applyingClass: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: application.tenantId },
    });

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: application.tenantId },
      select: {
        applicationFee: true,
        paymentGatewayEnabled: true,
        paymentGateway: true,
        paymentGatewaySecretKey: true,
      }
    });

    const applicationFee = settings?.applicationFee || 0;

    if (applicationFee <= 0) {
      return NextResponse.json({ error: 'No application fee required' }, { status: 400 });
    }

    if (!settings?.paymentGatewayEnabled) {
      return NextResponse.json({ 
        error: 'Payment gateway not configured. Please configure payment settings in School Settings.' 
      }, { status: 400 });
    }

    const effectiveGateway = settings.paymentGateway || gateway;
    let decryptedSecretKey = null;
    
    if (settings.paymentGatewaySecretKey) {
      try {
        decryptedSecretKey = decrypt(settings.paymentGatewaySecretKey);
      } catch (e) {
        console.error('Failed to decrypt payment gateway key:', e);
      }
    }

    if (!decryptedSecretKey) {
      return NextResponse.json({ error: 'Payment gateway not properly configured. Please update settings.' }, { status: 400 });
    }

    const paymentData = {
      email: application.email || application.phone + '@placeholder.com',
      phone: application.phone,
      amount: applicationFee * 100, // Convert to kobo
      currency: 'NGN' as const,
      metadata: {
        applicationId: application.id,
        applicationNo: application.applicationNo,
        applicantName: `${application.firstName} ${application.lastName}`,
      },
      description: `Application Fee - ${application.applicationNo}`,
    };

    let paymentUrl: string;
    let reference: string;

    if (effectiveGateway === 'PAYSTACK') {
      process.env.PAYSTACK_SECRET_KEY = decryptedSecretKey;
      const paystack = new PaystackService();
      const response = await paystack.initializePayment({
        ...paymentData,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/applications/payment/callback`,
      });
      paymentUrl = response.data.authorization_url;
      reference = response.data.reference;
    } else {
      process.env.FLUTTERWAVE_SECRET_KEY = decryptedSecretKey;
      const flutterwave = new FlutterwaveService();
      const response = await flutterwave.initializePayment({
        ...paymentData,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/applications/payment/callback`,
        txRef: `APP-${application.applicationNo}-${Date.now()}`,
      });
      paymentUrl = response.data.link;
      reference = response.data.tx_ref;
    }

    // Store payment reference
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        notes: `Payment Ref: ${reference}, Gateway: ${effectiveGateway}`,
      } as any,
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      reference,
      amount: applicationFee,
      currency: 'NGN',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Initialize payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const applicationId = searchParams.get('applicationId');
  const gateway = searchParams.get('gateway') || 'PAYSTACK';

  if (!reference || !applicationId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    let isValid = false;

    if (gateway === 'PAYSTACK') {
      const paystack = new PaystackService();
      const response = await paystack.verifyPayment(reference);
      isValid = response.data.status === 'success';
    } else {
      const flutterwave = new FlutterwaveService();
      const response = await flutterwave.verifyPayment(reference);
      isValid = response.data.status === 'successful';
    }

    if (isValid) {
      // Update application status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'REVIEWING',
          notes: `Payment verified via ${gateway}. Ref: ${reference}`,
        } as any,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      return NextResponse.json({
        error: 'Payment verification failed',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}