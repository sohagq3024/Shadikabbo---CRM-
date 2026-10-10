import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Check,
  Copy,
  User,
  Calendar,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ShadikabboLogo } from './ShadikabboLogo';
import { AuthoritySignature } from './AuthoritySignature';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // Default zoomed out at 78% so the entire invoice fits comfortably on screen without scrolling
  const [zoomLevel, setZoomLevel] = useState<number>(78);

  if (!isOpen || !payment) return null;

  // Extracted and formatted invoice data with safe fallbacks
  const candidateName = String(payment.name || 'Nasrin islam');
  const trafficId = String(
    payment.trafficId || (payment.id ? String(payment.id).replace('PAY-', 'SK-') : 'SK-0001')
  );
  const phone = String(payment.phone || '+880 01552955264');
  const servicePackage = String(payment.package || 'Platinum');
  const invoiceDate = String(payment.date || new Date().toISOString().split('T')[0]);
  const paymentMethod = String(payment.paymentMethod || 'bKash');

  // Amounts
  const paidAmount = Number(payment.paidAmount) || 0;
  const dueAmount = Number(payment.dueAmount) || 0;
  const packageTotal = (paidAmount + dueAmount) > 0 ? (paidAmount + dueAmount) : 50000;
  const afterMarriageFee = Number(payment.afterMarriageAmount || payment.afterMarriageFee) || 50000;

  // Formatted Invoice ID matching reference template "INV- SK-0001-0232"
  const rawInvoiceId = String(payment.invoiceId || '').trim();
  const invoiceId = rawInvoiceId
    ? (rawInvoiceId.startsWith('INV-') ? rawInvoiceId : `INV- ${rawInvoiceId}`)
    : `INV- ${trafficId}-0232`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 10));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(120, prev + 10));
  };

  const handleResetZoom = () => {
    setZoomLevel(78);
  };

  const handleDownload = () => {
    // Generate an authentic standalone HTML invoice document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - ${invoiceId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&family=Caveat:wght@700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      display: flex;
      justify-content: center;
      padding: 30px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-card {
      width: 100%;
      max-width: 720px;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.12);
      position: relative;
      border: 1px solid #e2e8f0;
    }
    .inner-canvas {
      position: relative;
      padding: 32px 38px 90px 38px;
      z-index: 10;
    }
    .top-swoosh {
      position: absolute;
      top: 0;
      left: 0;
      width: 220px;
      height: 120px;
      pointer-events: none;
      z-index: 1;
    }
    .bottom-swoosh {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 85px;
      pointer-events: none;
      z-index: 2;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 22px;
      position: relative;
      z-index: 10;
    }
    .brand-subtitle {
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      margin-top: 4px;
      letter-spacing: -0.1px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .red-divider-bar {
      width: 3.5px;
      height: 42px;
      background: #d81124;
      border-radius: 99px;
    }
    .invoice-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .title-official { color: #181e54; }
    .title-invoice { color: #d81124; }
    .inv-pill {
      display: inline-block;
      margin-top: 5px;
      background: #eef4fb;
      color: #181e54;
      font-family: 'Plus Jakarta Sans', monospace;
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 99px;
      letter-spacing: 0.4px;
      border: 1px solid #dce8f6;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .meta-box {
      background: #f1f6fb;
      border: 1px solid #dce7f2;
      border-radius: 16px;
      padding: 14px 16px;
    }
    .meta-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .meta-icon-circle {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #181e54;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
    }
    .meta-title {
      font-family: 'Outfit', sans-serif;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #181e54;
      text-transform: uppercase;
    }
    .red-line {
      flex: 1;
      height: 2px;
      background: #d81124;
      border-radius: 99px;
    }
    .meta-rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11.5px;
    }
    .meta-row {
      display: grid;
      grid-template-columns: 95px 12px 1fr;
      align-items: center;
      line-height: 1.35;
    }
    .meta-label { color: #334155; font-weight: 500; }
    .meta-colon { color: #0f172a; font-weight: 700; }
    .meta-val { color: #0f172a; font-weight: 600; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #16a34a;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 2.5px 8px;
      border-radius: 99px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #dce7f2;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 18px;
      background: #ffffff;
    }
    th {
      background: #181e54;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      padding: 10px 14px;
      text-transform: uppercase;
      border-right: 1px solid #283280;
    }
    th:last-child { border-right: none; }
    td {
      padding: 11px 14px;
      font-size: 11.5px;
      color: #1e293b;
      border-bottom: 1px solid #eef2f6;
      border-right: 1px solid #eef2f6;
    }
    td:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }
    .sl-col { width: 54px; text-align: center; font-weight: 700; color: #475569; }
    .desc-col { font-weight: 600; color: #1e293b; }
    .amount-col { text-align: right; font-weight: 700; font-family: 'Plus Jakarta Sans', monospace; }
    .amount-navy { color: #181e54; font-size: 12.5px; }
    .amount-green { color: #16a34a; font-size: 12.5px; }
    .amount-red { color: #d81124; font-size: 12.5px; }

    .summary-card {
      width: 320px;
      margin-left: auto;
      background: #f1f6fb;
      border: 1px solid #dce7f2;
      border-radius: 14px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 11.5px;
      font-weight: 600;
      color: #1e293b;
    }
    .banner-after-marriage {
      background: #181e54;
      color: #ffffff;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
    .banner-title { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; }
    .banner-val { font-family: 'Plus Jakarta Sans', monospace; font-size: 13.5px; font-weight: 800; }

    .terms-sig-row {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 16px;
      align-items: flex-end;
      position: relative;
      z-index: 10;
      padding-top: 4px;
      margin-top: 6px;
    }
    .terms-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #d81124;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .terms-header {
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      font-weight: 800;
      color: #181e54;
      margin-bottom: 5px;
      letter-spacing: 0.2px;
    }
    .terms-list {
      list-style-type: disc;
      padding-left: 14px;
      margin: 0;
      font-size: 9px;
      color: #475569;
      line-height: 1.45;
      font-weight: 500;
    }
    .terms-list li {
      margin-bottom: 2px;
    }
    .terms-list li:last-child {
      margin-bottom: 0;
    }
    .signature-box {
      text-align: right;
    }
    .sig-line {
      width: 145px;
      height: 1.5px;
      background: #181e54;
      margin: 5px 0 5px auto;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 800;
      color: #181e54;
    }
    .sig-subtitle {
      font-size: 10px;
      font-weight: 600;
      color: #181e54;
    }
    @media print {
      body { background: transparent !important; padding: 0 !important; }
      .invoice-card { box-shadow: none !important; border: none !important; max-width: 100% !important; border-radius: 0 !important; }
      .print-btn-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Top Left Swoosh SVG -->
    <svg class="top-swoosh" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M -20 -10 C 60 10 140 30 170 80 C 185 105 160 135 120 120 C 70 100 20 60 -30 60 Z" fill="#D81124" />
      <path d="M -10 -20 C 70 -5 120 20 140 60 C 130 50 100 30 50 20 C 10 10 -20 10 -30 0 Z" fill="#181E54" />
    </svg>

    <div class="inner-canvas">
      <!-- HEADER -->
      <div class="header-row">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 900; color: #181e54; letter-spacing: -0.5px;">SHADI</span>
            <span style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 900; color: #d81124; letter-spacing: -0.5px;">KABBO.COM</span>
          </div>
          <div class="brand-subtitle">Premium Matrimonial CRM &amp; Matchmaking Consultancy</div>
        </div>

        <div class="header-right">
          <div class="red-divider-bar"></div>
          <div>
            <div class="invoice-title">
              <span class="title-official">OFFICIAL </span>
              <span class="title-invoice">INVOICE</span>
            </div>
            <div class="inv-pill">${invoiceId}</div>
          </div>
        </div>
      </div>

      <!-- METADATA CARDS -->
      <div class="meta-grid">
        <!-- Billed To -->
        <div class="meta-box">
          <div class="meta-header">
            <div class="meta-icon-circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="meta-title">BILLED TO</div>
            <div class="red-line"></div>
          </div>
          <div class="meta-rows">
            <div class="meta-row">
              <span class="meta-label">Customer Name</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${candidateName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Client ID</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${trafficId}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Phone</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${phone}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Service Package</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${servicePackage}</span>
            </div>
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="meta-box">
          <div class="meta-header">
            <div class="meta-icon-circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div class="meta-title">INVOICE DETAILS</div>
            <div class="red-line"></div>
          </div>
          <div class="meta-rows">
            <div class="meta-row">
              <span class="meta-label">Date</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${invoiceDate}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Payment Method</span>
              <span class="meta-colon">:</span>
              <span class="meta-val">${paymentMethod}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Status</span>
              <span class="meta-colon">:</span>
              <div>
                <span class="status-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  PAID / VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <table>
        <thead>
          <tr>
            <th class="sl-col">SL</th>
            <th>DESCRIPTION</th>
            <th style="text-align: right; width: 160px;">AMOUNT (BDT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="sl-col">01</td>
            <td class="desc-col">Matrimonial Membership Package (${servicePackage})</td>
            <td class="amount-col amount-navy">${packageTotal.toLocaleString()} BDT</td>
          </tr>
          <tr>
            <td class="sl-col">02</td>
            <td class="desc-col">Paid Initial Deposit</td>
            <td class="amount-col amount-green">-${paidAmount.toLocaleString()} BDT</td>
          </tr>
          <tr>
            <td class="sl-col">03</td>
            <td class="desc-col">Remaining Due Balance</td>
            <td class="amount-col amount-red">${dueAmount.toLocaleString()} BDT</td>
          </tr>
          <tr>
            <td class="sl-col">04</td>
            <td class="desc-col">After Marriage Amount (AMA) Agreement</td>
            <td class="amount-col amount-navy">${afterMarriageFee.toLocaleString()} BDT</td>
          </tr>
        </tbody>
      </table>

      <!-- TOTALS CARD -->
      <div class="summary-card">
        <div class="summary-line">
          <span>Total Paid:</span>
          <span style="color: #16a34a; font-family: monospace; font-size: 13px; font-weight: 700;">${paidAmount.toLocaleString()} BDT</span>
        </div>
        <div class="summary-line" style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <span>Remaining Due:</span>
          <span style="color: #d81124; font-family: monospace; font-size: 13px; font-weight: 700;">${dueAmount.toLocaleString()} BDT</span>
        </div>
        <div class="banner-after-marriage">
          <span class="banner-title">After Marriage Fee:</span>
          <span class="banner-val">${afterMarriageFee.toLocaleString()} BDT</span>
        </div>
      </div>

      <!-- TERMS & CONDITIONS & AUTHORIZED SIGNATURE -->
      <div class="terms-sig-row">
        <!-- Terms and Conditions -->
        <div class="terms-card">
          <div class="terms-header">ShadiKabbo.com – Terms &amp; Conditions</div>
          <ul class="terms-list">
            <li>ShadiKabbo.com tries to find suitable matches but does not guarantee marriage.</li>
            <li>Clients are responsible for verifying the accuracy of personal and family information.</li>
            <li>Registration fees are strictly non-refundable and non-transferable.</li>
            <li>Registration does not guarantee a successful match or marriage.</li>
            <li>Applicable matching fees must be paid within the specified period.</li>
            <li>Final decisions, mutual consent, and personal information verification are the responsibility of the concerned parties.</li>
          </ul>
        </div>

        <!-- Authorized Signature -->
        <div class="signature-box">
          <svg width="150" height="52" viewBox="0 0 360 150" fill="none" style="display: block; margin-left: auto;">
            <path d="M 134 84 L 34 116 L 108 100" stroke="#181E54" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 106 100 C 96 104 94 114 100 120 C 106 126 118 126 124 118 C 128 112 126 102 118 100 C 112 98 106 106 110 118 C 114 106 124 94 132 94 C 140 94 140 118 134 122 C 128 124 126 112 136 102 C 142 96 150 96 154 108 C 156 118 148 122 144 122 C 146 110 154 100 162 100 C 170 100 170 118 164 122 C 168 110 176 100 184 100 C 192 100 192 118 186 122 C 190 110 198 100 206 100 C 214 100 216 116 210 122 C 214 112 222 102 228 102 C 236 102 240 114 234 122" stroke="#181E54" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 104 122 L 244 119" stroke="#181E54" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M 226 120 L 255 24 C 257 18 260 20 258 28 L 238 112 C 236 118 242 122 248 120 C 253 118 257 112 258 104 L 257 122" stroke="#181E54" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 104 84 L 340 58 C 343 57.5 346 58 344 61 L 339 64" stroke="#181E54" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="sig-line"></div>
          <div class="sig-title">Authorized Signature</div>
          <div class="sig-subtitle">Authority · Shadikabbo Accounts</div>
        </div>
      </div>
    </div>

    <!-- Bottom Double Wave SVG -->
    <svg class="bottom-swoosh" viewBox="0 0 820 110" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 0 110 L 0 50 C 180 85 460 20 820 70 L 820 110 Z" fill="#181E54"/>
      <path d="M 0 110 L 0 78 C 220 100 500 48 820 86 L 820 110 Z" fill="#D81124"/>
    </svg>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shadikabbo_Invoice_${invoiceId.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:shadow-none print:border-none print:m-0 print:max-h-none print:rounded-none">
        
        {/* Header Control Toolbar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50/95 shrink-0 print:hidden gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D81124]" />
              <h2 className="text-xs sm:text-sm font-bold text-[#181E54]">Official Invoice</h2>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md font-semibold">
              {invoiceId}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Interactive Zoom Controls */}
            <div className="flex items-center bg-slate-200/60 border border-slate-300/70 rounded-xl px-1 py-0.5 gap-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const cycle = [68, 78, 90, 100];
                  const next = cycle[(cycle.indexOf(zoomLevel) + 1) % cycle.length] || 78;
                  setZoomLevel(next);
                }}
                className="text-[10px] font-mono font-bold text-slate-700 hover:text-[#181E54] hover:bg-white px-1.5 py-0.5 rounded transition-colors min-w-[34px] text-center cursor-pointer select-none"
                title="Click to cycle zoom level"
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="text-[10px] font-semibold text-slate-600 hover:text-[#181E54] hover:bg-white px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                title="Reset to comfortable fit (78%)"
              >
                Fit
              </button>
            </div>

            {/* Copy Invoice No */}
            <button
              onClick={handleCopyInvoiceNumber}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Copy invoice ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ----------------- SCROLLABLE DOCUMENT VIEWER ----------------- */}
        <div className="flex-1 overflow-y-auto bg-slate-100/90 p-3 sm:p-5 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          {/* Zoom Scaled Invoice Container */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: '680px',
              maxWidth: '100%',
              marginBottom: zoomLevel < 100 ? `-${(100 - zoomLevel) * 7.5}px` : 0,
            }}
            className="transition-transform duration-150 ease-out shrink-0 print:transform-none print:w-full print:m-0"
          >
            {/* INVOICE SHEET VIEW (Matches Reference Picture 100%) */}
            <div
              ref={invoiceRef}
              className="relative bg-white text-slate-900 select-text overflow-hidden rounded-2xl shadow-xl border border-slate-200/90 print:shadow-none print:border-none print:rounded-none"
            >
              {/* Top Left Swoosh Wave Accent */}
              <div className="absolute top-0 left-0 w-44 sm:w-56 h-20 sm:h-28 pointer-events-none z-0">
                <svg
                  viewBox="0 0 240 140"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M -20 -10 C 60 10 140 30 170 80 C 185 105 160 135 120 120 C 70 100 20 60 -30 60 Z"
                    fill="#D81124"
                  />
                  <path
                    d="M -10 -20 C 70 -5 120 20 140 60 C 130 50 100 30 50 20 C 10 10 -20 10 -30 0 Z"
                    fill="#181E54"
                  />
                </svg>
              </div>

              <div className="relative z-10 px-6 sm:px-8 pt-5 pb-20 space-y-4">
                {/* 1. HEADER: BRAND LOGO (LEFT) & OFFICIAL INVOICE (RIGHT) */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <ShadikabboLogo size="md" />
                    <p className="text-[10.5px] font-semibold text-slate-600 mt-0.5 tracking-tight">
                      Premium Matrimonial CRM &amp; Matchmaking Consultancy
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 text-right">
                    <div className="w-1 h-10 bg-[#D81124] rounded-full"></div>
                    <div>
                      <div className="font-extrabold text-xl sm:text-2xl tracking-wide leading-none font-sans">
                        <span className="text-[#181E54]">OFFICIAL </span>
                        <span className="text-[#D81124]">INVOICE</span>
                      </div>
                      <div className="inline-block mt-1.5 px-3.5 py-0.5 bg-[#EEF4FB] text-[#181E54] rounded-full text-xs font-bold tracking-wider border border-[#DCE8F6] shadow-2xs">
                        {invoiceId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. METADATA: BILLED TO (LEFT) & INVOICE DETAILS (RIGHT) */}
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                  {/* Card 1: BILLED TO */}
                  <div className="bg-[#F1F6FB] border border-[#DCE7F2] rounded-xl p-3 sm:p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#181E54] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-extrabold text-[11px] tracking-wider text-[#181E54] uppercase">
                        BILLED TO
                      </h3>
                      <div className="flex-1 h-[1.5px] bg-[#D81124] rounded-full ml-1"></div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="grid grid-cols-[90px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Customer Name</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-bold text-slate-900 truncate">{candidateName}</span>
                      </div>
                      <div className="grid grid-cols-[90px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Client ID</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-bold text-slate-900 font-mono">{trafficId}</span>
                      </div>
                      <div className="grid grid-cols-[90px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Phone</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-semibold text-slate-900">{phone}</span>
                      </div>
                      <div className="grid grid-cols-[90px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Service Package</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-bold text-slate-900">{servicePackage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: INVOICE DETAILS */}
                  <div className="bg-[#F1F6FB] border border-[#DCE7F2] rounded-xl p-3 sm:p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#181E54] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-extrabold text-[11px] tracking-wider text-[#181E54] uppercase">
                        INVOICE DETAILS
                      </h3>
                      <div className="flex-1 h-[1.5px] bg-[#D81124] rounded-full ml-1"></div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="grid grid-cols-[98px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Date</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-semibold text-slate-900 font-mono">{invoiceDate}</span>
                      </div>
                      <div className="grid grid-cols-[98px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Payment Method</span>
                        <span className="font-bold text-slate-800">:</span>
                        <span className="font-bold text-slate-900">{paymentMethod}</span>
                      </div>
                      <div className="grid grid-cols-[98px_10px_1fr] items-center">
                        <span className="text-slate-600 font-medium">Status</span>
                        <span className="font-bold text-slate-800">:</span>
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[9px] font-extrabold tracking-wider shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            PAID / VERIFIED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. INVOICE TABLE: SL, DESCRIPTION, AMOUNT (BDT) */}
                <div className="border border-[#DCE7F2] rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#181E54] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-14 text-center border-r border-[#2C3477]">SL</th>
                        <th className="py-2.5 px-4 border-r border-[#2C3477]">DESCRIPTION</th>
                        <th className="py-2.5 px-4 text-right w-40">AMOUNT (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F6] text-[11.5px]">
                      {/* Row 01 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 border-r border-[#EEF2F6]">01</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-[#EEF2F6]">
                          Matrimonial Membership Package ({servicePackage})
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#181E54] font-mono text-xs">
                          {packageTotal.toLocaleString()} BDT
                        </td>
                      </tr>

                      {/* Row 02 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 border-r border-[#EEF2F6]">02</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-[#EEF2F6]">
                          Paid Initial Deposit
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#16A34A] font-mono text-xs">
                          -{paidAmount.toLocaleString()} BDT
                        </td>
                      </tr>

                      {/* Row 03 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 border-r border-[#EEF2F6]">03</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-[#EEF2F6]">
                          Remaining Due Balance
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#D81124] font-mono text-xs">
                          {dueAmount.toLocaleString()} BDT
                        </td>
                      </tr>

                      {/* Row 04 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 border-r border-[#EEF2F6]">04</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-[#EEF2F6]">
                          After Marriage Amount (AMA) Agreement
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#181E54] font-mono text-xs">
                          {afterMarriageFee.toLocaleString()} BDT
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS BREAKDOWN CARD (RIGHT-ALIGNED) */}
                <div className="w-[300px] ml-auto bg-[#F1F6FB] border border-[#DCE7F2] rounded-xl p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-bold text-slate-700">Total Paid:</span>
                    <span className="font-extrabold text-[#16A34A] font-mono text-xs">
                      {paidAmount.toLocaleString()} BDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px] pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Remaining Due:</span>
                    <span className="font-extrabold text-[#D81124] font-mono text-xs">
                      {dueAmount.toLocaleString()} BDT
                    </span>
                  </div>
                  <div className="bg-[#181E54] text-white rounded-lg px-3 py-2 flex items-center justify-between shadow-xs mt-1.5">
                    <span className="font-bold text-[10.5px] uppercase tracking-wide">After Marriage Fee:</span>
                    <span className="font-extrabold text-xs sm:text-[13px] font-mono">
                      {afterMarriageFee.toLocaleString()} BDT
                    </span>
                  </div>
                </div>

                {/* 5. TERMS & CONDITIONS AND AUTHORIZED SIGNATURE */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 sm:gap-4 items-end pt-1">
                  {/* Terms and condition */}
                  <div className="bg-slate-50 border border-slate-200/90 border-l-[3px] border-l-[#D81124] rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <h4 className="text-[11px] font-extrabold text-[#181E54] tracking-tight mb-1 font-sans">
                      ShadiKabbo.com – Terms &amp; Conditions
                    </h4>
                    <ul className="list-disc pl-4 space-y-0.5 text-[9.5px] text-slate-600 font-medium leading-relaxed">
                      <li>ShadiKabbo.com tries to find suitable matches but does not guarantee marriage.</li>
                      <li>Clients are responsible for verifying the accuracy of personal and family information.</li>
                      <li>Registration fees are strictly non-refundable and non-transferable.</li>
                      <li>Registration does not guarantee a successful match or marriage.</li>
                      <li>Applicable matching fees must be paid within the specified period.</li>
                      <li>Final decisions, mutual consent, and personal information verification are the responsibility of the concerned parties.</li>
                    </ul>
                  </div>

                  {/* Right Authorized Signature with exact uploaded handwriting */}
                  <div className="text-right">
                    <div className="inline-block ml-auto">
                      <AuthoritySignature
                        width={152}
                        height={54}
                        color="#181E54"
                        className="ml-auto block hover:scale-105 transition-transform"
                      />
                      <div className="w-36 h-[1.5px] bg-[#181E54] my-0.5 ml-auto"></div>
                      <div className="font-extrabold text-[11px] text-[#181E54]">Authorized Signature</div>
                      <div className="font-semibold text-[10px] text-slate-600">Authority · Shadikabbo Accounts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Dual Wave Accent (Flowing Navy & Red Curves) */}
              <div className="absolute bottom-0 left-0 w-full h-14 sm:h-18 pointer-events-none z-0">
                <svg
                  viewBox="0 0 820 110"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 0 110 L 0 50 C 180 85 460 20 820 70 L 820 110 Z" fill="#181E54" />
                  <path d="M 0 110 L 0 78 C 220 100 500 48 820 86 L 820 110 Z" fill="#D81124" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
