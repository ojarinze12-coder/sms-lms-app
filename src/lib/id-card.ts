import QRCode from 'qrcode';

export interface IDCardData {
  type: 'STUDENT' | 'TEACHER' | 'STAFF';
  id: string;
  studentId?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  photo?: string;
  tenantName: string;
  tenantLogo?: string;
  validUntil?: string;
  barcode: string;
}

export async function generateQRCodeDataURL(data: IDCardData): Promise<string> {
  const qrData = JSON.stringify({
    t: data.type,
    i: data.id,
    s: data.studentId,
    e: data.employeeId,
    n: `${data.firstName} ${data.lastName}`,
    v: data.validUntil
  });
  
  return await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

export async function generateQRCodeSVG(data: IDCardData): Promise<string> {
  const qrData = JSON.stringify({
    t: data.type,
    i: data.id,
    s: data.studentId,
    e: data.employeeId,
    n: `${data.firstName} ${data.lastName}`,
    v: data.validUntil
  });
  
  return await QRCode.toString(qrData, {
    type: 'svg',
    width: 200,
    margin: 2
  });
}

export function generateBarcode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 20);
}

export function createIDCardData(
  type: 'STUDENT' | 'TEACHER' | 'STAFF',
  id: string,
  person: {
    studentId?: string;
    employeeId?: string;
    firstName: string;
    lastName: string;
    photo?: string;
  },
  tenant: {
    name: string;
    logo?: string;
  },
  validUntil?: string
): IDCardData {
  const barcode = type === 'STUDENT' 
    ? `STU-${person.studentId || id.substring(0, 8).toUpperCase()}`
    : `STF-${person.employeeId || id.substring(0, 8).toUpperCase()}`;

  return {
    type,
    id,
    studentId: person.studentId,
    employeeId: person.employeeId,
    firstName: person.firstName,
    lastName: person.lastName,
    photo: person.photo,
    tenantName: tenant.name,
    tenantLogo: tenant.logo,
    validUntil,
    barcode
  };
}