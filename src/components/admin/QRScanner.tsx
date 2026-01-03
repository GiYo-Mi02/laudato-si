'use client';

/**
 * ============================================================================
 * QR SCANNER COMPONENT
 * ============================================================================
 * A modern QR code scanner component using the device camera.
 * Used by admins to quickly verify reward redemptions.
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, FlipHorizontal, Loader2, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function QRScanner({ onScan, onClose, isOpen = true }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError(
        err instanceof Error 
          ? err.name === 'NotAllowedError'
            ? 'Camera access denied. Please enable camera permissions.'
            : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : 'Failed to access camera.'
          : 'Failed to access camera.'
      );
      setHasCamera(false);
      setIsLoading(false);
    }
  }, [facingMode]);

  // Scan QR code from video frame
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const data = barcodes[0].rawValue;
          if (data && data !== lastScanned) {
            setLastScanned(data);
            onScan(data);
            // Reset after delay to allow scanning same code again
            setTimeout(() => setLastScanned(null), 2000);
          }
        }
      }
    } catch (err) {
      // Silently continue if detection fails
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, lastScanned]);

  // Start/stop camera based on isOpen
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, startCamera]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (!isLoading && !error && isOpen) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoading, error, isOpen, scanFrame]);

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Scanner Container */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-black">
        {/* Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner Brackets */}
          <div className="absolute inset-8">
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-green-500 rounded-tl-lg" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-green-500 rounded-tr-lg" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-green-500 rounded-bl-lg" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-green-500 rounded-br-lg" />
          </div>

          {/* Scanning Line Animation */}
          {!isLoading && !error && (
            <div className="absolute inset-8">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-green-500" />
              <p className="mt-4">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <CameraOff className="w-12 h-12 mx-auto text-red-500" />
              <p className="mt-4 text-red-400">{error}</p>
              <Button
                onClick={startCamera}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between">
          {hasCamera && (
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleCamera}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
            >
              <FlipHorizontal className="w-5 h-5 text-white" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <QrCode className="w-5 h-5 inline-block mr-2" />
        Point your camera at a QR code to scan
      </div>

      {/* Scanning Animation Style */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(calc(100% - 4px)); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
