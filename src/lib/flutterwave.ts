const FLUTTERWAVE_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

interface FlutterwaveInitializeResponse {
  status: string;
  message: string;
  data: {
    link: string;
    tx_ref: string;
  };
}

interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      phone: string;
      name: string;
    };
    meta: Record<string, string>;
  };
}

interface PaymentRequest {
  email: string;
  phone?: string;
  name: string;
  amount: number;
  currency?: 'NGN' | 'USD' | 'KES' | 'GBP';
  txRef?: string;
  meta?: Record<string, string>;
  redirectUrl?: string;
}

export class FlutterwaveService {
  private secretKey: string;

  constructor() {
    this.secretKey = FLUTTERWAVE_SECRET || '';
    if (!this.secretKey) {
      console.warn('FLUTTERWAVE_SECRET_KEY not configured');
    }
  }

  private async request<T>(endpoint: string, method: string, body?: object): Promise<T> {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.json() as Promise<T>;
  }

  async initializePayment(request: PaymentRequest): Promise<FlutterwaveInitializeResponse> {
    const txRef = request.txRef || `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const response = await this.request<FlutterwaveInitializeResponse>('/payments', 'POST', {
      tx_ref: txRef,
      amount: request.amount,
      currency: request.currency || 'NGN',
      redirect_url: request.redirectUrl,
      customer: {
        email: request.email,
        phone: request.phone || '',
        name: request.name,
      },
      meta: request.meta,
    });

    return response;
  }

  async verifyTransaction(txRef: string): Promise<FlutterwaveVerifyResponse> {
    return this.request<FlutterwaveVerifyResponse>(`/transactions/${txRef}/verify`, 'GET');
  }

  async createVirtualAccount(
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    amount?: number,
    currency?: string
  ): Promise<any> {
    return this.request('/virtual-account-numbers', 'POST', {
      email: customerEmail,
      bvn: '',
      firstname: customerName.split(' ')[0],
      lastname: customerName.split(' ').slice(1).join(' ') || '',
      phonenumber: customerPhone,
      amount,
      currency,
    });
  }

  async getBankList(country: string = 'NG'): Promise<any> {
    return this.request(`/banks/${country}`, 'GET');
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    return this.request('/accounts/resolve', 'POST', {
      account_number: accountNumber,
      bank_code: bankCode,
    });
  }

  generatePaymentLink(tenantId: string, studentId: string, feeId: string, amount: number, studentName: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/pay/flutterwave/${tenantId}/${studentId}/${feeId}?amount=${amount}&name=${encodeURIComponent(studentName)}`;
  }
}

export const flutterwave = new FlutterwaveService();
