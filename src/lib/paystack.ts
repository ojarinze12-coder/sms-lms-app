import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      phone: string;
    };
    metadata: Record<string, string>;
  };
}

interface PaymentRequest {
  email: string;
  amount: number; // In kobo (kobo * 100 = naira)
  currency?: 'NGN' | 'USD' | 'GBP' | 'EUR';
  reference?: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
}

export class PaystackService {
  private secretKey: string;

  constructor() {
    this.secretKey = PAYSTACK_SECRET || '';
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY not configured');
    }
  }

  private async request<T>(endpoint: string, method: string, body?: object): Promise<T> {
    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.json() as Promise<T>;
  }

  async initializePayment(request: PaymentRequest): Promise<PaystackInitializeResponse> {
    const reference = request.reference || `txn_${crypto.randomUUID()}`;
    
    const response = await this.request<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
      email: request.email,
      amount: request.amount,
      currency: request.currency || 'NGN',
      reference,
      metadata: request.metadata,
      callback_url: request.callbackUrl,
    });

    return response;
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    return this.request<PaystackVerifyResponse>(`/transaction/verify/${reference}`, 'GET');
  }

  async chargeAuthorization(
    email: string,
    amount: number,
    authorizationCode: string,
    metadata?: Record<string, string>
  ): Promise<any> {
    return this.request('/transaction/charge_authorization', 'POST', {
      email,
      amount,
      authorization_code: authorizationCode,
      metadata,
    });
  }

  async createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string
  ): Promise<any> {
    return this.request('/transferrecipient', 'POST', {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
    });
  }

  async initiateTransfer(
    amount: number,
    recipientCode: string,
    reference?: string
  ): Promise<any> {
    return this.request('/transfer', 'POST', {
      source: 'balance',
      amount,
      recipient: recipientCode,
      reference: reference || `txn_${crypto.randomUUID()}`,
    });
  }

  generatePaymentLink(tenantId: string, studentId: string, feeId: string, amount: number, studentName: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/pay/${tenantId}/${studentId}/${feeId}?amount=${amount}&name=${encodeURIComponent(studentName)}`;
  }
}

export const paystack = new PaystackService();

export function formatAmountToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatKoboToNaira(kobo: number): number {
  return kobo / 100;
}
