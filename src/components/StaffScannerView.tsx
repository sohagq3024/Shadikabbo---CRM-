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
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
  History,
  Check,
  X,
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

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Pleasant audio confirmation chime via Web Audio API
  const playBeep = () => {
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

      // Trigger haptic vibration if supported on phone
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      // Audio not allowed or unavailable
    }
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
      setCameraError(
        'Camera permission was not granted or camera is in use. You can use the ⚡ Quick Scan button below to record attendance.'
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
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Scanning loop analyzing video frames with jsQR
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Detected a QR code!
          handleQrDetected(code.data);
          return;
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
      alert('Invalid QR Code! Please scan the official Shadikabbo Office QR code.');
      setIsProcessing(false);
      if (cameraActive) startScanningLoop();
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
        throw new Error(json.error || 'Server rejected scan');
      }

      playBeep();
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

    playBeep();

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

  // Quick test scan handler (instant simulation)
  const handleQuickScan = () => {
    handleQrDetected('SHADIKABBO_OFFICE_ATTENDANCE_QR_2026');
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-[#D81124]">
      {/* Hidden canvas for jsQR analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShadikabboLogo size="sm" />
          <span className="hidden sm:inline-block h-4 w-px bg-slate-700" />
          <span className="text-xs font-bold text-slate-300 tracking-wide uppercase hidden sm:inline">
            Daily Attendance
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
            }`}
            title={isOnline ? 'Connected to Office Cloud' : 'Offline Mode: Scans are saved on device'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Mode</span>
              </>
            )}
          </div>

          <PWAInstallButton />

          {/* User badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <div className="w-6 h-6 rounded-full bg-[#D81124] text-white flex items-center justify-center font-bold text-[10px]">
              {user.role}
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 font-semibold">
                {user.role} Account
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* OFFLINE PENDING QUEUE BANNER */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-amber-500/40 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-amber-100 animate-bounce" />
            <span>
              <strong>{pendingCount}</strong> scan{pendingCount > 1 ? 's' : ''} stored offline on this device.
              {isOnline ? ' Ready to sync!' : ' Will auto-sync when online.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="text-[11px] underline text-amber-100 hover:text-white cursor-pointer"
            >
              View Queue
            </button>
            {isOnline && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
        {/* Today Status Pill / Live Clock */}
        <div className="w-full mb-3 flex items-center justify-between bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-white text-sm">{currentTime}</span>
          </div>

          <div>
            {todayStatus?.hasCheckedOut ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                Out: {todayStatus.record.outTime}
                {todayStatus.record.isOfflineQueued && (
                  <span className="text-[9px] text-amber-300 ml-1 font-mono">(Offline)</span>
                )}
              </span>
            ) : todayStatus?.hasCheckedIn ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                In: {todayStatus.record.inTime}
                {todayStatus.record.isOfflineQueued && (
                  <span className="text-[9px] text-amber-300 ml-1 font-mono">(Offline)</span>
                )}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Ready for In-Time
              </span>
            )}
          </div>
        </div>

        {/* Camera Viewport Container */}
        <div className="w-full aspect-square max-h-[360px] bg-black rounded-3xl overflow-hidden relative border-2 border-slate-700 shadow-2xl flex items-center justify-center">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/90">
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
                  <p className="text-xs text-slate-400">Starting office scanner camera...</p>
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
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce ${
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

              <h3 className="text-xl font-bold text-white">
                {scanResult.isOffline ? 'Attendance Saved (Offline)!' : 'Attendance Recorded!'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 font-medium">
                {scanResult.message}
              </p>

              {scanResult.isOffline && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold">
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Will auto-sync when internet reconnects</span>
                </div>
              )}

              <div className="mt-4 p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-xs font-mono space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Employee:</span>
                  <span className="font-bold text-white">{scanResult.record.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Time Recorded:</span>
                  <span className="font-bold text-emerald-400">
                    {scanResult.type === 'in' ? scanResult.record.inTime : scanResult.record.outTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Status:</span>
                  <span className="font-bold text-white capitalize">
                    {scanResult.type === 'in' ? 'Check-In' : 'Check-Out'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScanResult(null)}
                className={`mt-5 w-full py-2.5 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                  scanResult.isOffline
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Quick Instant Scan / Simulated Button */}
        <div className="w-full mt-3.5 space-y-2.5">
          <button
            type="button"
            onClick={handleQuickScan}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 border border-white/10"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span>⚡ Tap to Scan Office QR Code (Works Online &amp; Offline)</span>
          </button>

          {/* Today's Log Card */}
          {todayStatus?.record && (
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's In-Time</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {todayStatus.record.inTime}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's Out-Time</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {todayStatus.record.outTime || 'Still In Office'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 text-center text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Service Worker Offline Sync Active</span>
          </div>

          {allScans.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="text-[11px] text-slate-400 hover:text-white underline ml-2 flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>Offline Logs ({allScans.length})</span>
            </button>
          )}
        </div>

        {onSwitchToCrm && (
          <button
            type="button"
            onClick={onSwitchToCrm}
            className="text-xs text-slate-300 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Switch to CRM Database</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </footer>

      {/* OFFLINE QUEUE DETAILS MODAL */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Device Offline Attendance Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Logs recorded on this phone while disconnected from office Wi-Fi. Automatically synced via Service Worker when connection is restored.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allScans.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-800/50 rounded-xl">
                  No offline scans stored.
                </div>
              ) : (
                allScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {scan.type === 'in' ? 'Check-In' : 'Check-Out'}
                        </span>
                        <span>{scan.date}</span>
                        <span className="text-emerald-400 font-bold">{scan.recordedTimeStr}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Employee: {scan.userName} ({scan.userRole})
                      </p>
                    </div>

                    <div>
                      {scan.synced ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          <CloudUpload className="w-3 h-3 animate-pulse" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
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
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
