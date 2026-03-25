const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_BUSINESS_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN;

export type NotificationChannel = 'sms' | 'whatsapp' | 'email';

export interface NotificationPayload {
  to: string;
  channel: NotificationChannel;
  message: string;
  templateName?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface WhatsAppTemplate {
  name: string;
  language: { code: string };
  components: Array<{
    type: string;
    parameters: Array<{ type: string; text: string }>;
  }>;
}

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  absence_alert: {
    name: 'absence_alert',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{student_name}}' },
          { type: 'text', text: '{{class_name}}' },
          { type: 'text', text: '{{date}}' },
          { type: 'text', text: '{{reason}}' },
        ],
      },
    ],
  },
  fee_reminder: {
    name: 'fee_reminder',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{student_name}}' },
          { type: 'text', text: '{{amount}}' },
          { type: 'text', text: '{{due_date}}' },
          { type: 'text', text: '{{payment_link}}' },
        ],
      },
    ],
  },
  result_published: {
    name: 'result_published',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{student_name}}' },
          { type: 'text', text: '{{term}}' },
          { type: 'text', text: '{{view_link}}' },
        ],
      },
    ],
  },
  assignment_due: {
    name: 'assignment_due',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{student_name}}' },
          { type: 'text', text: '{{assignment_title}}' },
          { type: 'text', text: '{{due_date}}' },
        ],
      },
    ],
  },
  attendance_summary: {
    name: 'daily_attendance',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{student_name}}' },
          { type: 'text', text: '{{present_count}}' },
          { type: 'text', text: '{{total}}' },
          { type: 'text', text: '{{absent_list}}' },
        ],
      },
    ],
  },
};

export class NotificationService {
  private twilioClient: any;
  private whatsappBaseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.twilioClient = null;
  }

  private getTwilioClient() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !this.twilioClient) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      } catch (e) {
        console.warn('Twilio module not installed');
      }
    }
    return this.twilioClient;
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const client = this.getTwilioClient();
    if (!client) {
      console.warn('Twilio not configured, skipping SMS');
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      const result = await client.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: this.formatPhoneNumber(to, 'NG'),
      });

      return { success: true, messageId: result.sid };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsApp(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
      console.warn('WhatsApp not configured, falling back to SMS');
      return this.sendSMS(to, message);
    }

    try {
      const response = await fetch(`${this.whatsappBaseUrl}/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to, 'NG'),
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = WHATSAPP_TEMPLATES[templateName];
    if (!template) {
      return { success: false, error: `Template ${templateName} not found` };
    }

    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
      console.warn('WhatsApp not configured');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const components = template.components.map((comp) => ({
        ...comp,
        parameters: comp.parameters.map((param) => ({
          ...param,
          text: variables[param.text.replace(/{{|}}/g, '')] || param.text,
        })),
      }));

      const response = await fetch(`${this.whatsappBaseUrl}/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to, 'NG'),
          type: 'template',
          template: {
            name: template.name,
            language: template.language,
            components,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('WhatsApp template error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkWhatsApp(
    recipients: string[],
    message: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      recipients.map((to) => this.sendWhatsApp(to, message))
    );

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
      } else {
        failed++;
        errors.push(`Failed to send to ${recipients[index]}: ${result.status === 'rejected' ? result.reason : result.value.error}`);
      }
    });

    return { sent, failed, errors };
  }

  private formatPhoneNumber(phone: string, countryCode: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (countryCode === 'NG') {
      if (cleaned.startsWith('234')) {
        return `+${cleaned}`;
      } else if (cleaned.startsWith('0')) {
        return `+234${cleaned.substring(1)}`;
      } else if (cleaned.length === 10) {
        return `+234${cleaned}`;
      }
    }
    
    return phone.startsWith('+') ? phone : `+${phone}`;
  }

  formatPhoneForCountry(phone: string, country: 'NG' | 'US' | 'UK' = 'NG'): string {
    return this.formatPhoneNumber(phone, country);
  }
}

export const notifications = new NotificationService();

export async function sendAbsenceAlert(
  parentPhone: string,
  studentName: string,
  className: string,
  date: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return notifications.sendWhatsAppTemplate(parentPhone, 'absence_alert', {
    student_name: studentName,
    class_name: className,
    date,
    reason: reason || 'No reason provided',
  });
}

export async function sendFeeReminder(
  parentPhone: string,
  studentName: string,
  amount: string,
  dueDate: string,
  paymentLink: string
): Promise<{ success: boolean; error?: string }> {
  return notifications.sendWhatsAppTemplate(parentPhone, 'fee_reminder', {
    student_name: studentName,
    amount,
    due_date: dueDate,
    payment_link: paymentLink,
  });
}

export async function sendResultNotification(
  parentPhone: string,
  studentName: string,
  term: string,
  viewLink: string
): Promise<{ success: boolean; error?: string }> {
  return notifications.sendWhatsAppTemplate(parentPhone, 'result_published', {
    student_name: studentName,
    term,
    view_link: viewLink,
  });
}
