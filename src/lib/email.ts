import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email service not configured');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  return sendEmail({
    to,
    subject: 'Welcome to School LMS',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Your account has been created as a <strong>${role}</strong>.</p>
      <p>You can now login to the School LMS system.</p>
      <p>Best regards,<br>School Administration</p>
    `,
  });
}

export async function sendExamNotification(to: string, studentName: string, examTitle: string, subject: string) {
  return sendEmail({
    to,
    subject: `New Exam Available: ${examTitle}`,
    html: `
      <h1>Hello ${studentName}!</h1>
      <p>A new exam has been published:</p>
      <ul>
        <li><strong>Exam:</strong> ${examTitle}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p>Please login to take the exam.</p>
    `,
  });
}

export async function sendReportCardEmail(to: string, parentName: string, studentName: string, term: string, grade: string, average: number) {
  return sendEmail({
    to,
    subject: `Report Card Available: ${studentName} - ${term}`,
    html: `
      <h1>Hello ${parentName}!</h1>
      <p>The report card for <strong>${studentName}</strong> for <strong>${term}</strong> is now available.</p>
      <ul>
        <li><strong>Grade:</strong> ${grade}</li>
        <li><strong>Average:</strong> ${average.toFixed(1)}%</li>
      </ul>
      <p>Please login to view the full report card.</p>
    `,
  });
}

export async function sendResultNotificationEmail(
  to: string, 
  parentName: string, 
  studentName: string, 
  examTitle: string, 
  subject: string,
  score: number,
  percentage: number,
  grade: string
) {
  return sendEmail({
    to,
    subject: `New Result: ${studentName} - ${examTitle}`,
    html: `
      <h1>Hello ${parentName}!</h1>
      <p>A new result is available for <strong>${studentName}</strong>.</p>
      <ul>
        <li><strong>Exam:</strong> ${examTitle}</li>
        <li><strong>Subject:</strong> ${subject}</li>
        <li><strong>Score:</strong> ${score}</li>
        <li><strong>Percentage:</strong> ${percentage.toFixed(1)}%</li>
        <li><strong>Grade:</strong> ${grade}</li>
      </ul>
      <p>Please login to view the full details.</p>
    `,
  });
}

export async function sendInvoiceCreatedEmail(
  to: string,
  schoolName: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  dueDate: string,
  billingPeriod: string,
  planName: string
) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  return sendEmail({
    to,
    subject: `New Invoice: ${invoiceNumber} - ${formattedAmount}`,
    html: `
      <h1>Hello ${schoolName}!</h1>
      <p>A new subscription invoice has been generated for your institution.</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Invoice Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Invoice Number</td>
            <td style="padding: 8px 0; font-weight: bold;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Plan</td>
            <td style="padding: 8px 0;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Billing Period</td>
            <td style="padding: 8px 0;">${billingPeriod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount Due</td>
            <td style="padding: 8px 0; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Due Date</td>
            <td style="padding: 8px 0;">${dueDate}</td>
          </tr>
        </table>
      </div>
      <p>Please login to your dashboard to view and pay this invoice.</p>
      <p>Login: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://pccedu.com'}/school/billing">Click here</a></p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>PCC Educational Solutions</p>
    `,
  });
}

export async function sendPaymentReceiptEmail(
  to: string,
  schoolName: string,
  invoiceNumber: string,
  receiptNumber: string,
  amount: number,
  currency: string,
  paidAt: string,
  billingPeriod: string,
  planName: string,
  paymentMethod: string,
  gateway: string
) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  return sendEmail({
    to,
    subject: `Payment Receipt: ${receiptNumber} - ${schoolName}`,
    html: `
      <h1>Payment Received</h1>
      <p>Thank you for your payment, <strong>${schoolName}</strong>!</p>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
        <h2 style="margin-top: 0; color: #166534;">Payment Successful</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Receipt Number</td>
            <td style="padding: 8px 0; font-weight: bold;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Invoice Number</td>
            <td style="padding: 8px 0;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Plan</td>
            <td style="padding: 8px 0;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Billing Period</td>
            <td style="padding: 8px 0;">${billingPeriod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount Paid</td>
            <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #166534;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment Date</td>
            <td style="padding: 8px 0;">${paidAt}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment Method</td>
            <td style="padding: 8px 0;">${paymentMethod} (${gateway})</td>
          </tr>
        </table>
      </div>
      <p>Your subscription is now active. Thank you for your continued partnership!</p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>PCC Educational Solutions</p>
    `,
  });
}
