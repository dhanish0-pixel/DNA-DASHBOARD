import React, { useState } from 'react';
import { Eye, Search, Receipt, ArrowUpDown, Filter, Trash2 } from 'lucide-react';
import type { Sale } from '../../api/sales';
import { formatINR, formatDateTime } from '../../utils/formatters';

interface SalesHistoryTableProps {
  sales: Sale[];
  onViewReceipt: (sale: Sale) => void;
  onDeleteSale?: (sale: Sale) => void;
  isLoading?: boolean;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({
  sales,
  onViewReceipt,
  onDeleteSale,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = paymentFilter === 'ALL' || s.payment_method === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Filters Header */}
      <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none shadow-xs"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="UPI">UPI / QR</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Gross Profit</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Loading sales history...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                  No sales recorded yet.
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{s.invoice_number}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(s.created_at)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.customer_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      {s.items.reduce((acc, i) => acc + i.quantity, 0)} units
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {s.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatINR(s.total_amount)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">+{formatINR(s.total_profit)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewReceipt(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition-colors text-xs font-semibold"
                        title="View invoice receipt"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                      {onDeleteSale && (
                        <button
                          onClick={() => onDeleteSale(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-xs font-semibold"
                          title="Delete accidental transaction and restore stock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
