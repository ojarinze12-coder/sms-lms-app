import { prisma } from './prisma';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface SendSMSOptions {
  to: string | string[];
  message: string;
}

export interface SendWhatsAppOptions {
  to: string | string[];
  message: string;
}

export interface ExamNotificationOptions {
  examId: string;
  examTitle: string;
  subjectName: string;
  studentIds?: string[];
  type: 'new_exam' | 'exam_published' | 'results_published';
}

class NotificationService {
  private async getConfig(tenantId: string) {
    return await prisma.tenantConfig.findUnique({
      where: { tenantId },
    });
  }

  private async getSettings(tenantId: string) {
    return await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const tenantId = ''; // Will be set from context
      const config = await this.getConfig(tenantId);
      
      if (!config?.smtpHost || !config?.smtpFromEmail) {
        return { success: false, error: 'Email not configured' };
      }

      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpSecure ?? (config.smtpPort === 465),
        auth: config.smtpUser ? {
          user: config.smtpUser,
          pass: config.smtpPassword || '',
        } : undefined,
      });

      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      await transporter.sendMail({
        from: `"${config.smtpFromName || 'School'}" <${config.smtpFromEmail}>`,
        to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSMS(options: SendSMSOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const tenantId = ''; // Will be set from context
      const config = await this.getConfig(tenantId);
      
      if (!config?.smsProvider || !config?.smsApiKey) {
        return { success: false, error: 'SMS not configured' };
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const results = [];

      for (const phone of recipients) {
        // Format phone (remove +, spaces, and leading 0)
        const formattedPhone = phone.replace(/[\s\+]/g, '').replace(/^0/, '234');

        let result;
        
        if (config.smsProvider === 'BETACODE') {
          const response = await fetch('https://api.betacode.net/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.smsApiKey}`,
            },
            body: JSON.stringify({
              to: formattedPhone,
              from: config.smsSenderId,
              message: options.message,
            }),
          });
          result = await response.json();
          
        } else if (config.smsProvider === 'SMARTSMS') {
          const response = await fetch('https://api.smartsms.co/v1/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.smsApiKey}`,
            },
            body: JSON.stringify({
              to: [formattedPhone],
              from: config.smsSenderId,
              message: options.message,
            }),
          });
          result = await response.json();
          
        } else if (config.smsProvider === 'TWISTED') {
          const response = await fetch('https://api.twisted.ng/v1/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.smsApiKey}`,
            },
            body: JSON.stringify({
              to: formattedPhone,
              from: config.smsSenderId,
              message: options.message,
            }),
          });
          result = await response.json();
          
        } else if (config.smsProvider === 'TERMII') {
          const response = await fetch('https://api.termii.com/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: config.smsApiKey,
              to: formattedPhone,
              from: config.smsSenderId,
              sms: options.message,
            }),
          });
          result = await response.json();
        }

        if (result?.code === '100' || result?.success || result?.status === 'pending') {
          results.push({ phone, success: true });
        } else {
          results.push({ phone, success: false, error: result?.message });
        }
      }

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        return { success: false, error: `Failed for ${failed.length} recipients` };
      }

      return { success: true };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsApp(options: SendWhatsAppOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const tenantId = ''; // Will be set from context
      const config = await this.getConfig(tenantId);
      
      if (!config?.whatsappEnabled || !config?.whatsappApiUrl || !config?.whatsappApiToken) {
        return { success: false, error: 'WhatsApp not configured' };
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      for (const phone of recipients) {
        const formattedPhone = phone.replace(/[\s\+]/g, '').replace(/^0/, '234');
        
        const response = await fetch(`${config.whatsappApiUrl}/v17.0/${config.whatsappPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: options.message,
            },
          }),
        });

        const result = await response.json();
        
        if (!result?.messages?.[0]?.id) {
          return { success: false, error: result?.error?.message || 'WhatsApp sending failed' };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyExamStudents(options: ExamNotificationOptions & { tenantId: string }) {
    const { tenantId, examId, examTitle, subjectName, type } = options;
    
    // Get settings to check what's enabled
    const settings = await this.getSettings(tenantId);
    
    // Get students enrolled in the exam's subject
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          include: {
            academicClass: {
              include: {
                enrollments: {
                  include: { student: { include: { user: true, parent: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!exam?.subject) return;

    // Collect student contacts
    const studentEmails: string[] = [];
    const studentPhones: string[] = [];
    const parentPhones: string[] = [];

    for (const enrollment of exam.subject.academicClass.enrollments) {
      const student = enrollment.student;
      if (student.user?.email) studentEmails.push(student.user.email);
      if (student.phone) studentPhones.push(student.phone);
      if (student.parent?.phone) parentPhones.push(student.parent.phone);
    }

    // Prepare notification messages
    let title = '';
    let message = '';

    switch (type) {
      case 'new_exam':
        title = `New Exam: ${examTitle}`;
        message = `A new exam for ${subjectName} has been published. Please log in to take the exam.`;
        break;
      case 'results_published':
        title = `Exam Results: ${examTitle}`;
        message = `Your results for ${examTitle} (${subjectName}) are now available.`;
        break;
    }

    // Send notifications based on settings
    if (settings?.examNotifyEmail && studentEmails.length > 0) {
      await this.sendEmail({
        to: studentEmails,
        subject: title,
        text: message,
      });
    }

    if (settings?.examNotifySms && studentPhones.length > 0) {
      await this.sendSMS({
        to: studentPhones,
        message,
      });
    }

    if (settings?.examNotifySms && parentPhones.length > 0) {
      await this.sendSMS({
        to: parentPhones,
        message: `[${examTitle}] ${message}`,
      });
    }

    // In-app notifications would be handled separately
    // (this requires the in-app notification system)
  }
}

export const notificationService = new NotificationService();