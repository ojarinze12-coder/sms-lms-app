'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export default function DemoPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const ref = searchParams.get('ref') || '';
  const amount = searchParams.get('amount') || '0';
  const gateway = searchParams.get('gateway') || 'PAYSTACK';

  useEffect(() => {
    if (!ref) {
      setProcessing(false);
    }
  }, [ref]);

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        // In a real scenario, this would call an API to record the demo payment
        setStatus('success');
      } catch (error) {
        setStatus('failed');
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  const formatAmount = (amt: string) => {
    const num = parseFloat(amt);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(num);
  };

  if (!ref) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Invalid Payment Request
            </CardTitle>
            <CardDescription>
              Missing payment reference or amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Demo Payment</CardTitle>
          <CardDescription>
            This is a test payment for {gateway}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono text-sm">{ref}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-lg">{formatAmount(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gateway:</span>
              <span className="font-medium">{gateway}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium text-yellow-600">TEST/DEMO</span>
            </div>
          </div>

          {status === 'pending' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Click below to simulate a successful payment. No real charges will be made.
              </p>
              <Button 
                onClick={handlePayment} 
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatAmount(amount)}`
                )}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-600">Payment Successful!</h3>
                <p className="text-gray-600 text-sm mt-1">
                  This was a demo payment. In production, the payment would be processed through {gateway}.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-red-600">Payment Failed</h3>
                <p className="text-gray-600 text-sm mt-1">
                  The demo payment simulation failed. Please try again.
                </p>
              </div>
              <Button 
                onClick={() => setStatus('pending')} 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            Demo Mode: This is for testing purposes only. No real money is processed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}