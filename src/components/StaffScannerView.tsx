import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Sparkles,
  Smartphone,
  RefreshCw,
  Flashlight,
  SwitchCamera,
  QrCode,
  Zap,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
  History,
  Check,
  X,
  Vibrate,
} from 'lucide-react';
import { ShadikabboLogo } from './ShadikabboLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useOfflineAttendanceSync } from '../hooks/useOfflineAttendanceSync';
import { formatLocalTime12, formatLocalYMD, OfflineAttendanceScan } from '../utils/offlineAttendanceSync';

interface StaffScannerViewProps {
  user: any;
  token: string;
  onLogout: () => void;
  onSwitchToCrm?: () => void;
}

export const StaffScannerView: React.FC<StaffScannerViewProps> = ({
  user,
  token,
  onLogout,
  onSwitchToCrm,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Offline Attendance Synchronization Hook
  const {
    isOnline,
    pendingCount,
    pendingScans,
    allScans,
    isSyncing,
    lastSyncMessage,
    triggerSync,
    enqueueScan,
  } = useOfflineAttendanceSync(token);

  // Modal to inspect offline queue
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Today's attendance status from server / local cache
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Success Notification
  const [scanResult, setScanResult] = useState<{
    type: 'in' | 'out';
    message: string;
    record: any;
    isOffline?: boolean;
  } | null>(null);

  // Scan Error Message Modal/Toast
  const [scanError, setScanError] = useState<string | null>(null);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const barcodeDetectorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mandatory check: CRO and MK staff must scan QR to record In-Time attendance before accessing CRM (exempt on assigned Day-Off)
  const isMandatory =
    (user?.role === 'CRO' || user?.role === 'MK') &&
    !todayStatus?.hasCheckedIn &&
    !todayStatus?.isDayOffToday;

  // Initialize native BarcodeDetector once if available in the browser (Zero CPU / hardware-accelerated)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch (err) {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  /**
   * Tactile vibration / haptic feedback for mobile devices:
   * - 'success': Crisp double-pulse confirmation ([120, 60, 120] ms)
   * - 'error': Urgent triple-pulse buzz alert ([220, 90, 220, 90, 220] ms)
   * - 'warning': Dual warning pulse ([150, 80, 150] ms)
   */
  const triggerHaptic = (type: 'success' | 'error' | 'warning' = 'success') => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'success') {
          navigator.vibrate([120, 60, 120]);
        } else if (type === 'error') {
          navigator.vibrate([220, 90, 220, 90, 220]);
        } else {
          navigator.vibrate([150, 80, 150]);
        }
      }
    } catch (e) {
      // Ignore vibration error if blocked or unsupported
    }
  };

  // Pleasant audio confirmation chime via Web Audio API (for successful scans)
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.15); // D6 note

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // Audio not allowed or unavailable
    }
  };

  // Low warning buzz audio for error states
  const playErrorChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low A3
      osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.12); // Drop to E3

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio not allowed or unavailable
    }
  };

  // Combined confirmation helper for successful scan
  const handleScanSuccessFeedback = () => {
    triggerHaptic('success');
    playSuccessChime();
  };

  // Combined feedback helper for scan error
  const handleScanErrorFeedback = (errorMessage: string) => {
    triggerHaptic('error');
    playErrorChime();
    setScanError(errorMessage);
  };

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's current attendance status
  const fetchMyStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/attendance/my-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTodayStatus(json);
      }
    } catch (err) {
      console.warn('Network offline or failed to fetch status, checking local status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchMyStatus();
  }, [token]);

  // When auto-sync completes, refresh status from server
  useEffect(() => {
    if (lastSyncMessage && lastSyncMessage.includes('Successfully synced')) {
      fetchMyStatus();
    }
  }, [lastSyncMessage]);

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not available in this browser. You can use the Quick Scan button below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Critical for iOS
        await videoRef.current.play();
        setCameraActive(true);

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }

        // Start scanning loop
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      triggerHaptic('error');
      playErrorChime();
      setCameraError(
        'Camera permission was not granted or camera is in use. Please allow camera permissions or upload a clear photo of the office QR code below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Safe handler to stop camera and return immediately to CRM
  const handleBack = () => {
    stopCamera();
    if (onSwitchToCrm) {
      onSwitchToCrm();
    }
  };

  // Highly optimized scanning loop analyzing video frames
  // Throttled to ~10-12 checks/sec (every 90ms) so CPU is virtually 0%, leaving UI 100% fluid & responsive
  const startScanningLoop = () => {
    let active = true;

    const scanFrame = async () => {
      if (!active) return;

      const video = videoRef.current;
      if (!video || isProcessing) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      const now = performance.now();
      // Throttle scanning checks to every 90ms
      if (now - lastScanTimestamp.current >= 90 && video.readyState >= 2 && video.videoWidth > 0) {
        lastScanTimestamp.current = now;

        // Path 1: Native hardware-accelerated BarcodeDetector (Zero CPU, GPU accelerated)
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (active && barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              active = false;
              handleQrDetected(barcodes[0].rawValue);
              return;
            }
          } catch (e) {
            // Fallback to jsQR path below if BarcodeDetector errors on this frame
          }
        }

        // Path 2: Ultra-optimized downscaled jsQR fallback
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Downscale to max 480px width for fast decoding and tiny memory footprint
            const maxDim = 480;
            const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
            const targetWidth = Math.round(video.videoWidth * scale);
            const targetHeight = Math.round(video.videoHeight * scale);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const code = jsQR(imageData.data, targetWidth, targetHeight, {
              inversionAttempts: 'dontInvert',
            });

            if (active && code && code.data) {
              active = false;
              handleQrDetected(code.data);
              return;
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  /**
   * Main QR Detection & Processing
   * Handles both online and offline scanning seamlessly via Service Worker strategy
   */
  const handleQrDetected = async (qrString: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const now = new Date();
    const formattedTime = formatLocalTime12(now);
    const todayStr = formatLocalYMD(now);

    // Validate QR code against official office string
    const trimmed = qrString.trim();
    const isValidCode =
      trimmed === 'SHADIKABBO_OFFICE_ATTENDANCE_QR_2026' ||
      trimmed.includes('SHADIKABBO_OFFICE_ATTENDANCE') ||
      trimmed.includes('SHADIKABBO_OFFICE_QR');

    if (!isValidCode) {
      handleScanErrorFeedback('Invalid QR Code! Please point camera at the official Shadikabbo Office QR code.');
      setIsProcessing(false);
      setTimeout(() => {
        setScanError(null);
        if (cameraActive) startScanningLoop();
      }, 3500);
      return;
    }

    // Determine optimistic scan type (Check-in vs Check-out)
    const isAlreadyCheckedIn = todayStatus?.hasCheckedIn;
    const isAlreadyCheckedOut = todayStatus?.hasCheckedOut;
    const targetType: 'in' | 'out' = isAlreadyCheckedIn && !isAlreadyCheckedOut ? 'out' : 'in';

    // 1. If currently OFFLINE -> Record locally in queue immediately!
    if (!isOnline || !navigator.onLine) {
      recordScanOffline(targetType, now, formattedTime, todayStr, qrString);
      return;
    }

    // 2. If ONLINE -> Try regular server recording with automatic offline fallback
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrCode: qrString,
          clientTimestamp: now.getTime(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        handleScanErrorFeedback(json.error || 'Server rejected scan');
        setIsProcessing(false);
        setTimeout(() => {
          setScanError(null);
          if (cameraActive) startScanningLoop();
        }, 3500);
        return;
      }

      handleScanSuccessFeedback();
      setScanResult({
        type: json.type,
        message: json.message,
        record: json.record,
        isOffline: false,
      });

      // Refresh today's status from server
      await fetchMyStatus();
    } catch (err: any) {
      console.warn('Online scan request failed, switching to offline fallback queue:', err);
      // Fallback: If network drops during request, preserve scan in offline queue
      recordScanOffline(targetType, now, formattedTime, todayStr, qrString);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        if (cameraActive) {
          startScanningLoop();
        }
      }, 3000);
    }
  };

  /**
   * Save scan to local offline queue and display optimistic success UI
   */
  const recordScanOffline = (
    type: 'in' | 'out',
    dateObj: Date,
    formattedTime: string,
    todayStr: string,
    qrString: string
  ) => {
    // Enqueue scan to persistent storage
    const offlineScan = enqueueScan({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userPhone: user.phone,
      qrCode: qrString,
      type,
    });

    handleScanSuccessFeedback();

    // Optimistically update today status for immediate user confidence
    setTodayStatus((prev: any) => {
      if (type === 'in') {
        return {
          date: todayStr,
          user: { id: user.id, name: user.name, role: user.role },
          hasCheckedIn: true,
          hasCheckedOut: false,
          record: {
            inTime: formattedTime,
            outTime: null,
            status: 'present',
            isOfflineQueued: true,
            userName: user.name,
          },
        };
      } else {
        return {
          ...prev,
          hasCheckedIn: true,
          hasCheckedOut: true,
          record: {
            ...(prev?.record || {}),
            outTime: formattedTime,
            isOfflineQueued: true,
          },
        };
      }
    });

    setScanResult({
      type,
      message:
        type === 'in'
          ? `Check-In recorded at ${formattedTime}! Log saved on your phone and will automatically sync when connected to office internet.`
          : `Check-Out recorded at ${formattedTime}! Log saved on your phone and will automatically sync when connected to office internet.`,
      record: {
        userName: user.name,
        inTime: type === 'in' ? formattedTime : (todayStatus?.record?.inTime || formattedTime),
        outTime: type === 'out' ? formattedTime : null,
      },
      isOffline: true,
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (cameraActive) {
        startScanningLoop();
      }
    }, 3000);
  };

  // Real image file QR scan fallback (reads image pixels and decodes real QR code)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            handleScanErrorFeedback('Could not process image canvas');
            setIsProcessing(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, img.width, img.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleQrDetected(code.data);
          } else {
            handleScanErrorFeedback('No valid QR code detected in the selected image. Please point camera directly or select a clear photo of the office QR code.');
            setIsProcessing(false);
          }
        } catch (err: any) {
          handleScanErrorFeedback('Failed to decode image file');
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        handleScanErrorFeedback('Failed to load image file');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  // Support mobile hardware back button, swipe back, and Escape key navigation
  useEffect(() => {
    try {
      window.history.pushState({ scannerOpen: true }, '');
    } catch (e) {
      // ignore
    }

    const handlePopState = () => {
      stopCamera();
      if (onSwitchToCrm) {
        onSwitchToCrm();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera();
        if (onSwitchToCrm) {
          onSwitchToCrm();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSwitchToCrm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-[#D81124] selection:text-white">
      {/* Hidden canvas for jsQR analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 p-2.5 sm:p-4 sticky top-0 z-30 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Back to CRM / Attendance Button (TOP LEFT) */}
          {onSwitchToCrm && (
            isMandatory ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 shadow-xs cursor-not-allowed select-none"
                title="Office QR Attendance scan is mandatory for CRO & MK staff to access CRM"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Mandatory Check-In</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs border border-slate-200 shadow-xs transition-all cursor-pointer"
                title="Return to Attendance & CRM Web App"
              >
                <ArrowLeft className="w-4 h-4 text-[#D81124]" />
                <span className="font-bold">Back to CRM</span>
              </button>
            )
          )}

          <ShadikabboLogo size="sm" />
          <span className="hidden md:inline-block h-4 w-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-600 tracking-wide uppercase hidden md:inline">
            Daily Attendance
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs animate-pulse'
            }`}
            title={isOnline ? 'Connected to Office Cloud' : 'Offline Mode: Scans are saved on device'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          <PWAInstallButton />

          {/* User badge */}
          <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-6 h-6 rounded-full bg-[#D81124] text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 shadow-xs">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.role
              )}
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[100px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-semibold">
                {user.role} Account
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* OFFLINE PENDING QUEUE BANNER */}
      {pendingCount > 0 && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-white animate-bounce" />
            <span>
              <strong>{pendingCount}</strong> scan{pendingCount > 1 ? 's' : ''} stored offline on this device.
              {isOnline ? ' Ready to sync!' : ' Will auto-sync when online.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="text-[11px] underline text-white hover:text-amber-100 cursor-pointer font-bold"
            >
              View Queue
            </button>
            {isOnline && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-[11px] font-bold hover:bg-amber-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SYNC NOTIFICATION TOAST */}
      {lastSyncMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold text-center shadow-md animate-in slide-in-from-top-2">
          {lastSyncMessage}
        </div>
      )}

      {/* MAIN SCANNER AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 max-w-lg w-full mx-auto relative">
        {/* Navigation & Live Clock Row */}
        <div className="w-full mb-3 flex items-center justify-between gap-2">
          {onSwitchToCrm && !isMandatory && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-xs"
              title="Return to Attendance & CRM"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#D81124]" />
              <span>Back to Attendance</span>
            </button>
          )}

          {isMandatory && (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Mandatory In-Time Scan</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs ml-auto shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#181E54]" />
            <span className="font-mono font-bold text-[#181E54] text-xs">{currentTime}</span>
          </div>
        </div>

        {/* Today Status Pill */}
        <div className="w-full mb-3 flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-xs shadow-xs">
          <span className="text-slate-500 font-semibold text-[11px]">Today's Status:</span>
          <div>
            {todayStatus?.hasCheckedOut ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Out: {todayStatus.record.outTime}
                {todayStatus.record.isOfflineQueued && (
                  <span className="text-[9px] text-amber-600 ml-1 font-mono">(Offline)</span>
                )}
              </span>
            ) : todayStatus?.hasCheckedIn ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                In: {todayStatus.record.inTime}
                {todayStatus.record.isOfflineQueued && (
                  <span className="text-[9px] text-amber-600 ml-1 font-mono">(Offline)</span>
                )}
              </span>
            ) : todayStatus?.isDayOffToday ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <span>🌴</span>
                <span>Weekly Day-Off (ছুটি)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Ready for In-Time
              </span>
            )}
          </div>
        </div>

        {/* Camera Viewport Container */}
        <div className="w-full aspect-square max-h-[360px] bg-slate-950 rounded-3xl overflow-hidden relative border-2 border-slate-200 shadow-xl flex items-center justify-center ring-4 ring-slate-100">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
          />

          {/* Camera Loading or Error State */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/90 text-white">
              {cameraError ? (
                <>
                  <AlertCircle className="w-10 h-10 text-[#D81124] mb-2 animate-bounce" />
                  <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer mb-3"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs text-slate-300">Starting office scanner camera...</p>
                </>
              )}
            </div>
          )}

          {/* Targeting Box & Laser Scan Animation */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/40 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Corner Markers */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#D81124] rounded-tl-xl" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#D81124] rounded-tr-xl" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#D81124] rounded-bl-xl" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#D81124] rounded-br-xl" />

                {/* Laser scan line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#D81124] to-transparent shadow-[0_0_12px_#D81124] animate-bounce" />

                <div className="absolute -bottom-8 inset-x-0 text-center">
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-medium text-white border border-white/20">
                    Align Office QR Code within frame
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Controls Overlay (Torch & Flip) */}
          {cameraActive && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                    torchOn ? 'bg-amber-400 text-slate-900 shadow-lg' : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  title="Toggle Flash"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={switchCamera}
                className="p-2.5 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all cursor-pointer"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scan Result Overlay Modal */}
        {scanResult && (
          <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl text-slate-800">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md animate-bounce ${
                  scanResult.isOffline
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}
              >
                {scanResult.isOffline ? (
                  <Database className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-9 h-9" />
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {scanResult.isOffline ? 'Attendance Saved (Offline)!' : 'Attendance Recorded!'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {scanResult.message}
              </p>

              {scanResult.isOffline && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  <CloudUpload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Will auto-sync when internet reconnects</span>
                </div>
              )}

              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Employee:</span>
                  <span className="font-bold text-slate-800">{scanResult.record.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Time Recorded:</span>
                  <span className="font-bold text-emerald-600">
                    {scanResult.type === 'in' ? scanResult.record.inTime : scanResult.record.outTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Status:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {scanResult.type === 'in' ? 'Check-In' : 'Check-Out'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScanResult(null);
                  if (onSwitchToCrm) onSwitchToCrm();
                }}
                className="mt-5 w-full py-2.5 bg-[#181E54] hover:bg-[#212971] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>{onSwitchToCrm ? 'Proceed to CRM Web App' : 'Done'}</span>
                {onSwitchToCrm && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Scan Error Overlay Modal with Haptic Feedback */}
        {scanError && (
          <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white border-2 border-rose-300 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl text-slate-800">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md bg-rose-50 border border-rose-200 text-rose-600 animate-pulse">
                <AlertCircle className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">Scan Failed</h3>
              <p className="text-xs text-rose-700 mt-2 font-medium leading-relaxed">
                {scanError}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                <Vibrate className="w-3.5 h-3.5 text-rose-600" />
                <span>Tactile haptic error alert triggered</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScanError(null);
                  if (cameraActive) startScanningLoop();
                }}
                className="mt-5 w-full py-2.5 bg-[#D81124] hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Dismiss &amp; Try Again
              </button>
            </div>
          </div>
        )}

        {/* Real QR Verification & Tactile Controls Container */}
        <div className="w-full mt-3.5 space-y-2.5">
          {/* div:nth-of-type(1): Real Attendance Verification Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    isMandatory
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : todayStatus?.hasCheckedOut
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs leading-tight">
                    {isMandatory
                      ? 'Mandatory In-Time Attendance'
                      : todayStatus?.isDayOffToday && !todayStatus?.hasCheckedIn
                      ? 'Weekly Day-Off (সাপ্তাহিক ছুটি)'
                      : todayStatus?.hasCheckedOut
                      ? 'Daily Attendance Complete'
                      : 'Office Attendance Verified'}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">
                    {isMandatory
                      ? 'CRO & MK accounts must scan Office QR to unlock CRM access'
                      : todayStatus?.isDayOffToday && !todayStatus?.hasCheckedIn
                      ? 'Today is your assigned day-off. Scanning QR attendance is optional.'
                      : todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut
                      ? 'Scan official QR again upon leaving to record Out-Time'
                      : 'Real-time camera detection active for official Office QR code'}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                  isMandatory
                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    : todayStatus?.isDayOffToday && !todayStatus?.hasCheckedIn
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isMandatory
                  ? 'Mandatory'
                  : todayStatus?.isDayOffToday && !todayStatus?.hasCheckedIn
                  ? 'Day Off'
                  : 'Active'}
              </span>
            </div>

            {/* Real action buttons: Photo QR Scan Fallback & Haptic Test */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 rounded-xl font-bold text-[11px] border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Scan photo of office QR code from gallery or camera files"
              >
                <Camera className="w-3.5 h-3.5 text-[#181E54]" />
                <span>Scan QR From Photo File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  playSuccessChime();
                }}
                className="py-2 px-3 text-[11px] font-bold text-[#181E54] hover:bg-slate-100 bg-slate-50 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                title="Test tactile vibration on your phone"
              >
                <Vibrate className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Haptic</span>
              </button>
            </div>
          </div>

          {/* Today's Log Card (div:nth-of-type(2)) */}
          {todayStatus?.record && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between shadow-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Today's In-Time</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {todayStatus.record.inTime}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Today's Out-Time</span>
                <span className="font-mono font-bold text-slate-700 text-sm">
                  {todayStatus.record.outTime || 'Still In Office'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-3 sm:p-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Service Worker Offline Sync Active</span>
          </div>

          {allScans.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="text-[11px] text-slate-600 hover:text-[#181E54] underline ml-2 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <History className="w-3.5 h-3.5" />
              <span>Offline Logs ({allScans.length})</span>
            </button>
          )}
        </div>

        {onSwitchToCrm && !isMandatory && (
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-600 hover:text-[#181E54] underline font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D81124]" />
            <span>Back to Attendance / CRM</span>
          </button>
        )}
      </footer>

      {/* OFFLINE QUEUE DETAILS MODAL */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 shadow-2xl text-left text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Device Offline Attendance Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Logs recorded on this phone while disconnected from office Wi-Fi. Automatically synced via Service Worker when connection is restored.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allScans.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  No offline scans stored.
                </div>
              ) : (
                allScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {scan.type === 'in' ? 'Check-In' : 'Check-Out'}
                        </span>
                        <span>{scan.date}</span>
                        <span className="text-emerald-600 font-bold">{scan.recordedTimeStr}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Employee: {scan.userName} ({scan.userRole})
                      </p>
                    </div>

                    <div>
                      {scan.synced ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <CloudUpload className="w-3 h-3 text-amber-600 animate-pulse" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Network: {isOnline ? '🟢 Online' : '🟠 Offline'}
              </span>

              <div className="flex items-center gap-2">
                {isOnline && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await triggerSync();
                    }}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-[#181E54] hover:bg-[#232b77] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
