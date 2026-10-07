import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface OfficeQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const OfficeQrCodeModal: React.FC<OfficeQrCodeModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [qrData, setQrData] = useState<{ secret: string; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchQr = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/attendance/qr-code', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setQrData({ secret: data.secret, dataUrl: data.dataUrl });
        }
      } catch (err) {
        console.error('Failed to load QR code:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQr();
  }, [isOpen, token]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrData) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shadikabbo Attendance QR Code</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; color: #181E54; }
            .card { max-width: 450px; margin: auto; border: 3px solid #181E54; border-radius: 24px; padding: 30px; }
            h1 { font-size: 26px; margin: 0 0 8px 0; color: #181E54; }
            p { font-size: 14px; color: #64748B; margin: 0 0 20px 0; }
            img { width: 300px; height: 300px; margin: 10px 0; }
            .inst { font-size: 13px; font-weight: bold; background: #F1F5F9; padding: 12px; border-radius: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>SHADIKABBO CRM</h1>
            <p>Official Daily Attendance QR Code</p>
            <img src="${qrData.dataUrl}" alt="Attendance QR Code" />
            <div class="inst">
              Open Shadikabbo App on your phone & scan this code to record In-Time / Out-Time automatically.
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrData?.dataUrl) return;
    const a = document.createElement('a');
    a.href = qrData.dataUrl;
    a.download = 'shadikabbo-office-attendance-qr.png';
    a.click();
  };

  const handleCopySecret = () => {
    if (!qrData?.secret) return;
    navigator.clipboard.writeText(qrData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#181E54] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <QrCode className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-[#181E54]">Office Attendance QR Code</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Display or print this QR code at office entry. Staff scan it from their phone app for daily In &amp; Out attendance.
        </p>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-[#181E54] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Generating high-res QR code...</p>
          </div>
        ) : qrData ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={qrData.dataUrl}
                alt="Office Attendance QR Code"
                className="w-56 h-56 mx-auto rounded-xl shadow-xs bg-white p-2"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 bg-slate-100 p-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Shadikabbo Secure Attendance Token</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#181E54] text-white text-xs font-bold hover:bg-[#121742] transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
