import { notifications } from './notifications';
import { prisma } from './prisma';

export type ApplicationStatus = 
  | 'PENDING' 
  | 'REVIEWING' 
  | 'ENTRANCE_EXAM' 
  | 'INTERVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ENROLLED'
  | 'WITHDRAWN';

interface ApplicationNotificationData {
  applicationNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: ApplicationStatus;
  applyingClass?: string;
  entranceExamDate?: string;
  entranceExamLocation?: string;
  interviewDate?: string;
  interviewLocation?: string;
  notes?: string;
  tenantName: string;
}

const statusMessages: Record<ApplicationStatus, { sms: string; emailSubject: string }> = {
  PENDING: {
    sms: 'Your application {applicationNo} has been received and is pending review. We will contact you soon.',
    emailSubject: 'Application Received - {applicationNo}',
  },
  REVIEWING: {
    sms: 'Your application {applicationNo} is now being reviewed. You will be notified of next steps.',
    emailSubject: 'Application Under Review - {applicationNo}',
  },
  ENTRANCE_EXAM: {
    sms: 'Congratulations! You have been scheduled for entrance exam on {entranceExamDate} at {entranceExamLocation}. Application: {applicationNo}',
    emailSubject: 'Entrance Exam Schedule - {applicationNo}',
  },
  INTERVIEW: {
    sms: 'You have been invited for an interview on {interviewDate} at {interviewLocation}. Application: {applicationNo}',
    emailSubject: 'Interview Invitation - {applicationNo}',
  },
  APPROVED: {
    sms: 'Congratulations! Your application {applicationNo} has been APPROVED. Please visit the school to complete enrollment.',
    emailSubject: 'Application Approved - {applicationNo}',
  },
  REJECTED: {
    sms: 'We regret to inform you that your application {applicationNo} was not successful. For more information, contact the school.',
    emailSubject: 'Application Update - {applicationNo}',
  },
  ENROLLED: {
    sms: 'Welcome! You have been successfully enrolled. Student ID: {applicationNo}. Visit the school for your ID card.',
    emailSubject: 'Enrollment Confirmed - {applicationNo}',
  },
  WITHDRAWN: {
    sms: 'Your application {applicationNo} has been withdrawn.',
    emailSubject: 'Application Withdrawn - {applicationNo}',
  },
};

export async function sendApplicationNotification(
  data: ApplicationNotificationData,
  notifyParent: boolean = true
) {
  const statusInfo = statusMessages[data.status];
  
  if (!statusInfo) {
    console.warn(`No notification template for status: ${data.status}`);
    return;
  }

  // Replace variables in SMS message
  let smsMessage = statusInfo.sms
    .replace(/{applicationNo}/g, data.applicationNo)
    .replace(/{firstName}/g, data.firstName)
    .replace(/{entranceExamDate}/g, data.entranceExamDate || 'TBA')
    .replace(/{entranceExamLocation}/g, data.entranceExamLocation || 'TBA')
    .replace(/{interviewDate}/g, data.interviewDate || 'TBA')
    .replace(/{interviewLocation}/g, data.interviewLocation || 'TBA');

  let emailSubject = statusInfo.emailSubject
    .replace(/{applicationNo}/g, data.applicationNo);

  // Send SMS
  if (data.phone) {
    try {
      await notifications.sendSMS(data.phone, smsMessage);
      console.log(`SMS notification sent to ${data.phone} for application ${data.applicationNo}`);
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  // Send Email
  if (data.email && notifyParent) {
    const emailBody = `
Dear ${data.firstName} ${data.lastName},

${smsMessage}

Application Details:
- Application Number: ${data.applicationNo}
- Applied Class: ${data.applyingClass || 'N/A'}
- Status: ${data.status}

${data.notes ? `\nNotes: ${data.notes}` : ''}

${data.status === 'ENROLLED' ? '\nPlease visit the school to complete registration and collect your student ID card.' : ''}

Best regards,
${data.tenantName}
`;

    try {
      await notifications.sendEmail(data.email, emailSubject, emailBody);
      console.log(`Email notification sent to ${data.email} for application ${data.applicationNo}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
}

export async function sendApplicationSubmittedNotification(
  applicationId: string
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applyingClass: true,
      tenant: true,
    },
  });

  if (!application) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: application.tenantId },
  });

  await sendApplicationNotification({
    applicationNo: application.applicationNo,
    firstName: application.firstName,
    lastName: application.lastName,
    phone: application.phone,
    email: application.email || undefined,
    status: 'PENDING' as ApplicationStatus,
    applyingClass: application.applyingClass?.name,
    tenantName: tenant?.name || 'The School',
  });
}

export async function notifyApplicationStatusChange(
  applicationId: string,
  newStatus: ApplicationStatus,
  additionalData?: {
    entranceExamDate?: string;
    entranceExamLocation?: string;
    interviewDate?: string;
    interviewLocation?: string;
    notes?: string;
  }
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applyingClass: true,
    },
  });

  if (!application) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: application.tenantId },
  });

  await sendApplicationNotification({
    applicationNo: application.applicationNo,
    firstName: application.firstName,
    lastName: application.lastName,
    phone: application.phone,
    email: application.email || undefined,
    status: newStatus,
    applyingClass: application.applyingClass?.name,
    entranceExamDate: additionalData?.entranceExamDate,
    entranceExamLocation: additionalData?.entranceExamLocation,
    interviewDate: additionalData?.interviewDate,
    interviewLocation: additionalData?.interviewLocation,
    notes: additionalData?.notes,
    tenantName: tenant?.name || 'The School',
  });
}