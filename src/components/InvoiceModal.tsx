import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { ShadikabboLogo } from './ShadikabboLogo';

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

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate clean self-contained HTML invoice download
    if (!invoiceRef.current) return;
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.invoiceId || 'Shadikabbo'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #181e54; padding-bottom: 20px; margin-bottom: 30px; }
          .brand-title { color: #181e54; font-size: 24px; font-weight: 800; }
          .brand-red { color: #d81124; }
          .meta { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .text-right { text-align: right; }
          .total-box { margin-left: auto; width: 300px; font-size: 14px; line-height: 1.8; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand-total { border-top: 2px solid #181e54; font-weight: bold; font-size: 16px; color: #181e54; margin-top: 8px; padding-top: 8px; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .stamp { border: 2px dashed #d81124; padding: 8px 16px; border-radius: 8px; color: #d81124; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">SHADI<span class="brand-red">KABBO.COM</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Premium Matrimonial CRM & Matchmaking Consultancy</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: bold; color: #181e54;">OFFICIAL INVOICE</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${payment.invoiceId || 'INV-2026-001'}</div>
          </div>
        </div>

        <div class="meta">
          <div>
            <strong>BILLED TO:</strong><br>
            <strong>Customer:</strong> ${payment.name}<br>
            <strong>Traffic ID:</strong> ${payment.trafficId}<br>
            <strong>Phone:</strong> ${payment.phone || 'N/A'}<br>
            <strong>Service Package:</strong> ${payment.package || 'Custom'}
          </div>
          <div style="text-align: right;">
            <strong>INVOICE DETAILS:</strong><br>
            <strong>Date:</strong> ${payment.date}<br>
            <strong>Payment Method:</strong> ${payment.paymentMethod || 'bKash'}<br>
            <strong>Status:</strong> PAID / VERIFIED
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Matrimonial Membership Package (${payment.package || 'Standard'})</td>
              <td class="text-right">${((payment.paidAmount || 0) + (payment.dueAmount || 0)).toLocaleString()} BDT</td>
            </tr>
            <tr>
              <td>Paid Initial Deposit</td>
              <td class="text-right" style="color: #16a34a; font-weight: bold;">-${(payment.paidAmount || 0).toLocaleString()} BDT</td>
            </tr>
            <tr>
              <td>Remaining Due Balance</td>
              <td class="text-right" style="color: #dc2626; font-weight: bold;">${(payment.dueAmount || 0).toLocaleString()} BDT</td>
            </tr>
            <tr>
              <td>After Marriage Amount (AMA) Agreement</td>
              <td class="text-right" style="color: #181e54; font-weight: bold;">${(payment.afterMarriageAmount || 0).toLocaleString()} BDT</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Total Paid:</span> <span style="font-weight: bold; color: #16a34a;">${(payment.paidAmount || 0).toLocaleString()} BDT</span></div>
          <div class="total-row"><span>Remaining Due:</span> <span style="font-weight: bold; color: #dc2626;">${(payment.dueAmount || 0).toLocaleString()} BDT</span></div>
          <div class="total-row grand-total"><span>After Marriage Fee:</span> <span>${(payment.afterMarriageAmount || 0).toLocaleString()} BDT</span></div>
        </div>

        <div class="footer">
          <div>
            <div class="stamp">OFFICIAL PAYMENT ACCEPTED</div>
            <p style="margin-top: 10px;">Authorized Signature: Shadikabbo Accounts</p>
          </div>
          <div style="text-align: right;">
            <p>Thank you for placing your trust in Shadikabbo.com</p>
            <p>Official Support: 01723867646</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${payment.invoiceId || payment.trafficId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:m-0">
        
        {/* Header Controls (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D81124]" />
            <h2 className="text-base font-bold text-[#181E54]">Official Payment Invoice</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        <div ref={invoiceRef} className="p-8 space-y-6 text-xs text-slate-800 bg-white">
          
          {/* Logo & Invoice Title */}
          <div className="flex items-start justify-between border-b-2 border-[#181E54] pb-6">
            <div>
              <ShadikabboLogo size="md" />
              <p className="text-[11px] text-slate-500 mt-2">
                Premium Matrimonial CRM &amp; Matchmaking Consultancy
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#181E54] tracking-wide block">
                INVOICE
              </span>
              <span className="font-mono text-xs font-bold text-slate-600 block mt-1">
                {payment.invoiceId || 'INV-2026-001'}
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                PAID &amp; VERIFIED
              </span>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed Client
              </span>
              <p className="font-bold text-sm text-slate-900">{payment.name}</p>
              <p className="text-slate-500 mt-0.5">Traffic ID: <span className="font-mono text-slate-700">{payment.trafficId}</span></p>
              {payment.phone && <p className="text-slate-500">Phone: {payment.phone}</p>}
              <p className="text-slate-500">Package: {payment.package || 'Gold Package'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Invoice Details
              </span>
              <p className="text-slate-600">Date: <span className="font-semibold text-slate-900">{payment.date}</span></p>
              <p className="text-slate-600">Payment Method: <span className="font-semibold text-slate-900">{payment.paymentMethod || 'bKash'}</span></p>
              <p className="text-slate-600">Handled By: <span className="font-semibold text-slate-900">{payment.assignedBy || 'MK/CRO'}</span></p>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Line Item Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    Registration &amp; Consultation Fee ({payment.package || 'Standard'})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {((payment.paidAmount || 0) + (payment.dueAmount || 0)).toLocaleString()} BDT
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="py-3 px-4 font-semibold text-emerald-800">
                    Paid Amount (Received &amp; Approved)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    {(payment.paidAmount || 0).toLocaleString()} BDT
                  </td>
                </tr>
                <tr className="bg-red-50/30">
                  <td className="py-3 px-4 font-semibold text-red-800">
                    Remaining Due Amount
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                    {(payment.dueAmount || 0).toLocaleString()} BDT
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-[#181E54]">
                    After Marriage Amount (AMA) Agreement
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#181E54]">
                    {(payment.afterMarriageAmount || 0).toLocaleString()} BDT
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Authorization Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="border-2 border-dashed border-[#D81124] px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] font-black tracking-widest text-[#D81124] uppercase block">
                SHADIKABBO OFFICIAL STAMP
              </span>
              <span className="text-[9px] text-slate-500 font-mono">VERIFIED TRANSACTION</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">Authorized Officer</p>
              <div className="h-8 border-b border-slate-300 w-36 ml-auto mt-1" />
              <p className="text-[10px] text-slate-400 mt-1">Shadikabbo CRM Accounts</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
