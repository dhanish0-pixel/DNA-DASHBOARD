import React from 'react';
import { Modal } from '../common/Modal';
import type { Sale } from '../../api/sales';
import { formatINR, formatDateTime } from '../../utils/formatters';
import { Printer, CheckCircle2, Sparkles, Building2, Phone, Mail } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sales Receipt & Tax Invoice" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* Printable Invoice Container */}
        <div id="printable-receipt" className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-black/95 border border-amber-500/40 p-0.5 flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="House of DNA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">House of DNA</h3>
                  <p className="text-[10px] text-amber-700 font-serif italic">Style runs in your DNA.</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Tech Park, Commercial Zone, Whitefield, Bangalore</p>
              <p className="text-[11px] text-slate-400">GSTIN: 29AAAAA0000A1Z5 | Phone: +91 98765 43210</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-1">
                PAID INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-slate-800">{sale.invoice_number}</p>
              <p className="text-[11px] text-slate-500">{formatDateTime(sale.created_at)}</p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Billed To</span>
              <p className="font-bold text-slate-900">{sale.customer_name || 'Walk-in Customer'}</p>
              {sale.customer_phone && <p className="text-slate-500">{sale.customer_phone}</p>}
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Payment Details</span>
              <p className="font-bold text-slate-900">{sale.payment_method}</p>
              <p className="text-slate-500 capitalize">Status: {sale.status}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-2">
                  <td className="py-2 font-medium text-slate-800">
                    {item.product_name}
                    <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                  </td>
                  <td className="py-2 text-center font-bold text-slate-700">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-600">{formatINR(item.unit_price)}</td>
                  <td className="py-2 text-right font-bold text-slate-900">{formatINR(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculation Breakdown */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatINR(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-semibold">-{formatINR(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST):</span>
                <span className="font-semibold">+{formatINR(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-blue-600 text-base">{formatINR(sale.total_amount)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-800">Thank you for shopping with House of DNA!</p>
            <p className="text-amber-800 font-serif italic mb-0.5">Style runs in your DNA.</p>
            <p>Goods once sold can be returned/exchanged within 7 days with original invoice.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Receipt / Invoice
          </button>
        </div>
      </div>
    </Modal>
  );
};
