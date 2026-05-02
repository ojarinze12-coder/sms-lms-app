import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, testEmail, testPhone } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Test type is required' }, { status: 400 });
    }

    const tenantId = authUser.tenantId;
    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Test Email/SMTP
    if (type === 'email') {
      const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName, smtpSecure } = config;

      if (!smtpHost || !smtpFromEmail) {
        return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });
      }

      try {
        // Create nodemailer transpoter for testing
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort || 587,
          secure: smtpSecure ?? (smtpPort === 465),
          auth: smtpUser ? {
            user: smtpUser,
            pass: smtpPassword || '',
          } : undefined,
          connectionTimeout: 10000,
        });

        // Test connection
        await transporter.verify();
        
        // If testEmail provided, send test email
        if (testEmail) {
          const info = await transporter.sendMail({
            from: `"${smtpFromName || 'School'}" <${smtpFromEmail}>`,
            to: testEmail,
            subject: 'Test Email - School Management System',
            text: 'This is a test email from your school management system.',
            html: '<p>This is a test email from your school management system.</p>',
          });
          
          return NextResponse.json({ 
            success: true, 
            message: 'Email configuration is working! Test email sent.',
            messageId: info.messageId 
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'SMTP connection is working! No test email sent.' 
        });

      } catch (smtpError: any) {
        console.error('SMTP test error:', smtpError);
        return NextResponse.json({ 
          error: 'SMTP connection failed: ' + smtpError.message 
        }, { status: 400 });
      }
    }

    // Test SMS
    if (type === 'sms') {
      const { smsProvider, smsApiKey, smsSenderId, smsEnvironment } = config;

      if (!smsProvider || !smsApiKey) {
        return NextResponse.json({ error: 'SMS provider not configured' }, { status: 400 });
      }

      if (!testPhone) {
        return NextResponse.json({ error: 'Test phone number required' }, { status: 400 });
      }

      try {
        let result;
        
        if (smsProvider === 'BETACODE') {
          // Betacode SMS API
          const response = await fetch('https://api.betacode.net/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${smsApiKey}`,
            },
            body: JSON.stringify({
              to: testPhone,
              from: smsSenderId,
              message: 'Test SMS from School Management System',
            }),
          });
          result = await response.json();
          
        } else if (smsProvider === 'SMARTSMS') {
          // SmartSMS API
          const response = await fetch('https://api.smartsms.co/v1/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${smsApiKey}`,
            },
            body: JSON.stringify({
              to: [testPhone],
              from: smsSenderId,
              message: 'Test SMS from School Management System',
            }),
          });
          result = await response.json();
          
        } else if (smsProvider === 'TWISTED') {
          // Twisted SMS API
          const response = await fetch('https://api.twisted.ng/v1/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${smsApiKey}`,
            },
            body: JSON.stringify({
              to: testPhone,
              from: smsSenderId,
              message: 'Test SMS from School Management System',
            }),
          });
          result = await response.json();
          
        } else if (smsProvider === 'TERMII') {
          // Termii API
          const response = await fetch('https://api.termii.com/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: smsApiKey,
              to: testPhone,
              from: smsSenderId,
              sms: 'Test SMS from School Management System',
            }),
          });
          result = await response.json();
        } else {
          return NextResponse.json({ error: 'Unsupported SMS provider' }, { status: 400 });
        }

        if (result?.code === '100' || result?.success || result?.status === 'pending') {
          return NextResponse.json({ 
            success: true, 
            message: 'SMS sent successfully!' 
          });
        }

        return NextResponse.json({ 
          error: result?.message || 'SMS sending failed' 
        }, { status: 400 });

      } catch (smsError: any) {
        console.error('SMS test error:', smsError);
        return NextResponse.json({ 
          error: 'SMS test failed: ' + smsError.message 
        }, { status: 400 });
      }
    }

    // Test WhatsApp
    if (type === 'whatsapp') {
      const { whatsappEnabled, whatsappApiUrl, whatsappApiToken, whatsappPhoneId } = config;

      if (!whatsappEnabled || !whatsappApiUrl || !whatsappApiToken) {
        return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 });
      }

      if (!testPhone) {
        return NextResponse.json({ error: 'Test phone number required' }, { status: 400 });
      }

      try {
        // Format phone for WhatsApp (add country code if needed)
        const formattedPhone = testPhone.replace(/^0/, '234');
        
        const response = await fetch(`${whatsappApiUrl}/v17.0/${whatsappPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: 'Test WhatsApp message from School Management System',
            },
          }),
        });

        const result = await response.json();

        if (result?.messages?.[0]?.id) {
          return NextResponse.json({ 
            success: true, 
            message: 'WhatsApp message sent successfully!' 
          });
        }

        return NextResponse.json({ 
          error: result?.error?.message || 'WhatsApp sending failed' 
        }, { status: 400 });

      } catch (waError: any) {
        console.error('WhatsApp test error:', waError);
        return NextResponse.json({ 
          error: 'WhatsApp test failed: ' + waError.message 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });

  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}