'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

interface FingerprintCaptureProps {
  onCapture: (fingerprintData: string) => void;
  onCancel?: () => void;
  mode?: 'enroll' | 'verify';
}

// This is a placeholder for actual fingerprint scanner integration
// In production, integrate with: DigitalPersona, Crossmatch, or Futronic SDK
export function FingerprintCapture({ onCapture, onCancel, mode = 'enroll' }: FingerprintCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  async function checkDeviceConnected() {
    setDeviceConnected(true);
    setMessage('Fingerprint scanner ready');
  }

  useEffect(() => {
    checkDeviceConnected();
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  function startScanning() {
    setStatus('scanning');
    setMessage(mode === 'enroll' ? 'Place your finger on the scanner...' : 'Place your finger to verify...');
    setScanAttempts(prev => prev + 1);

    // Simulate scanning process
    // In production, this would call the actual scanner SDK
    scanIntervalRef.current = setTimeout(() => {
      // Generate simulated fingerprint data
      const mockData = generateMockFingerprint(scanAttempts);
      setFingerprintData(mockData);
      setStatus('success');
      setMessage(mode === 'enroll' ? 'Fingerprint enrolled successfully!' : 'Fingerprint verified successfully!');
    }, 2000);
  }

  function generateMockFingerprint(attempt: number): string {
    // This creates a mock fingerprint template
    // In production, replace with actual SDK fingerprint template
    const template = {
      version: '1.0',
      type: mode,
      timestamp: new Date().toISOString(),
      attempt: attempt + 1,
      // Real fingerprint templates are much larger and binary
      // This is a placeholder showing the data structure
      templateData: `FP_TEMPLATE_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`
    };
    return btoa(JSON.stringify(template));
  }

  function retry() {
    setStatus('idle');
    setMessage('');
    setFingerprintData(null);
  }

  function confirmCapture() {
    if (fingerprintData) {
      onCapture(fingerprintData);
    }
  }

  function cancelScanning() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setStatus('idle');
    setMessage('');
    if (onCancel) onCancel();
  }

  return (
    <div className="space-y-4">
      {/* Device Status */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${deviceConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {deviceConnected ? (
          <>
            <Fingerprint className="h-5 w-5" />
            <span className="text-sm font-medium">Fingerprint scanner connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">No fingerprint scanner detected</span>
          </>
        )}
      </div>

      {/* Fingerprint Scanner UI */}
      <div className={`border-4 rounded-full mx-auto w-40 h-40 flex items-center justify-center transition-all ${
        status === 'scanning' 
          ? 'border-blue-500 bg-blue-50 animate-pulse' 
          : status === 'success'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-gray-50'
      }`}>
        {status === 'idle' && (
          <Fingerprint className="w-16 h-16 text-gray-400" />
        )}
        {status === 'scanning' && (
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        )}
        {status === 'success' && (
          <Check className="w-16 h-16 text-green-500" />
        )}
        {status === 'error' && (
          <X className="w-16 h-16 text-red-500" />
        )}
      </div>

      {/* Status Message */}
      <div className="text-center">
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {message || (deviceConnected ? 'Click Start to begin scanning' : 'Connect a fingerprint scanner')}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {status === 'idle' && deviceConnected && (
          <Button onClick={startScanning}>
            <Fingerprint className="h-4 w-4 mr-2" />
            {mode === 'enroll' ? 'Start Enrollment' : 'Start Verification'}
          </Button>
        )}

        {status === 'scanning' && (
          <Button variant="outline" onClick={cancelScanning}>
            Cancel
          </Button>
        )}

        {status === 'success' && (
          <>
            <Button variant="outline" onClick={retry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={confirmCapture}>
              <Check className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          </>
        )}
      </div>

      {onCancel && status !== 'scanning' && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      {/* Instructions */}
      {status === 'idle' && deviceConnected && (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Place finger firmly on the scanner</li>
            <li>Keep finger still during scanning</li>
            <li>For best results, use index finger</li>
            <li>Scanner may take 2-3 seconds to capture</li>
          </ul>
        </div>
      )}
    </div>
  );
}

interface BiometricEnrollmentProps {
  value?: string;
  onChange: (fingerprintData: string) => void;
  onEnroll?: () => void;
}

export function BiometricEnrollment({ value, onChange, onEnroll }: BiometricEnrollmentProps) {
  const [showCapture, setShowCapture] = useState(false);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">Biometric Enrolled</p>
            <p className="text-xs text-green-600">Fingerprint template stored</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onChange('')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">No biometric enrolled</p>
              <p className="text-xs text-gray-500">Enroll fingerprint for attendance & ID verification</p>
            </div>
          </div>
          <Button 
            className="mt-3" 
            onClick={() => setShowCapture(!showCapture)}
          >
            <Fingerprint className="h-4 w-4 mr-2" />
            Enroll Fingerprint
          </Button>
        </div>
      )}

      {showCapture && (
        <div className="border rounded-lg p-4">
          <FingerprintCapture 
            onCapture={(data) => { onChange(data); setShowCapture(false); }} 
            onCancel={() => setShowCapture(false)}
          />
        </div>
      )}
    </div>
  );
}