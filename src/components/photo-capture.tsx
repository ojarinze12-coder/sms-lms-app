'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X, Upload } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
}

export function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }

  function switchCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    startCamera();
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);
  }

  function retakePhoto() {
    setCaptured(null);
  }

  function confirmPhoto() {
    if (captured) {
      onCapture(captured);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {captured ? (
          <img src={captured} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!captured ? (
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={switchCamera}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Switch Camera
          </Button>
          <Button type="button" onClick={capturePhoto}>
            <Camera className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={retakePhoto}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
          <Button type="button" onClick={confirmPhoto}>
            <Check className="h-4 w-4 mr-2" />
            Use Photo
          </Button>
        </div>
      )}

      {onCancel && (
        <div className="flex justify-center">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

interface FileUploadProps {
  onUpload: (imageData: string) => void;
  accept?: string;
}

export function FileUpload({ onUpload, accept = 'image/*' }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload photo</p>
        </div>
        <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      </label>
      {preview && (
        <div className="relative w-24 h-24 mx-auto">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-full" />
        </div>
      )}
    </div>
  );
}

interface PhotoCaptureProps {
  value?: string;
  onChange: (imageData: string) => void;
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const [showWebcam, setShowWebcam] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative w-32 h-32 mx-auto">
          <img src={value} alt="Current photo" className="w-full h-full object-cover rounded-full border-4 border-gray-200" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => { setShowWebcam(!showWebcam); setShowUpload(false); }}>
          <Camera className="h-4 w-4 mr-1" />
          Webcam
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setShowUpload(!showUpload); setShowWebcam(false); }}>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </div>

      {showWebcam && (
        <div className="border rounded-lg p-4">
          <WebcamCapture 
            onCapture={(img) => { onChange(img); setShowWebcam(false); }} 
            onCancel={() => setShowWebcam(false)}
          />
        </div>
      )}

      {showUpload && (
        <div className="border rounded-lg p-4">
          <FileUpload onUpload={(img) => { onChange(img); setShowUpload(false); }} />
        </div>
      )}
    </div>
  );
}