const REMITA_BASE_URL = 'https://remitademo.remita.net';
const REMITA_API_KEY = process.env.REMITA_API_KEY;
const REMITA_MERCHANT_ID = process.env.REMITA_MERCHANT_ID;

interface SalaryPaymentRequest {
  employeeName: string;
  employeeId: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  paymentDate: string;
  description: string;
}

interface BulkSalaryPaymentRequest {
  salaryBatchId: string;
  payments: SalaryPaymentRequest[];
}

export class RemitaService {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = REMITA_API_KEY || '';
    this.merchantId = REMITA_MERCHANT_ID || '';
    this.baseUrl = REMITA_BASE_URL;
    
    if (!this.apiKey || !this.merchantId) {
      console.warn('Remita credentials not configured');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'MerchantId': this.merchantId,
    };
  }

  async initiateSalaryPayment(request: SalaryPaymentRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/salary/v1/disburse`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          merchantId: this.merchantId,
        }),
      });

      return response.json();
    } catch (error) {
      console.error('Remita salary payment error:', error);
      throw error;
    }
  }

  async initiateBulkSalaryPayment(request: BulkSalaryPaymentRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/salary/v1/disburse/bulk`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          merchantId: this.merchantId,
        }),
      });

      return response.json();
    } catch (error) {
      console.error('Remita bulk salary payment error:', error);
      throw error;
    }
  }

  async getSalaryPaymentStatus(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/salary/v1/status/${this.merchantId}/${reference}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Remita payment status error:', error);
      throw error;
    }
  }

  async validateAccount(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/v1/verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          accountNumber,
          bankCode,
          merchantId: this.merchantId,
        }),
      });

      return response.json();
    } catch (error) {
      console.error('Remita account validation error:', error);
      throw error;
    }
  }

  async getBanks(): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/banks/v1/branches`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      return response.json();
    } catch (error) {
      console.error('Remita banks error:', error);
      throw error;
    }
  }

  calculatePensionDeduction(basicSalary: number, rate: number = 0.08): number {
    return Math.round(basicSalary * rate * 100) / 100;
  }

  calculateTaxDeduction(basicSalary: number): number {
    const annual = basicSalary * 12;
    let tax = 0;
    
    if (annual > 300000) {
      tax = (annual - 300000) * 0.2;
    }
    
    return Math.round((tax / 12) * 100) / 100;
  }

  calculateNHFDeduction(basicSalary: number, rate: number = 0.025): number {
    return Math.round(basicSalary * rate * 100) / 100;
  }
}

export const remita = new RemitaService();
