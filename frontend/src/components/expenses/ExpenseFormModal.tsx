import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { expensesApi, type ExpensePayload } from '../../api/expenses';

const expenseSchema = z.object({
  title: z.string().min(2, 'Expense title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.string().default('Bank Transfer'),
  description: z.string().optional(),
  reference_no: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: '',
      category: categories[0] || 'Store Supplies',
      amount: 1000,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Bank Transfer',
      description: '',
      reference_no: '',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await expensesApi.createExpense(data as ExpensePayload);
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Operating Expense" subtitle="Expenses will be automatically deducted from Net Profit" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Expense Name / Title *</label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Monthly Store Rent, Electricity Bill"
            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
          />
          {errors.title && <p className="text-rose-500 text-[11px] mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
            <select
              {...register('category')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-rose-500 text-[11px] mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {errors.amount && <p className="text-rose-500 text-[11px] mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date *</label>
            <input
              type="date"
              {...register('date')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
            />
            {errors.date && <p className="text-rose-500 text-[11px] mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
            <select
              {...register('payment_method')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Transaction ID</label>
          <input
            type="text"
            {...register('reference_no')}
            placeholder="e.g. UTR-982312, Chq #4821"
            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
          <textarea
            rows={2}
            {...register('description')}
            placeholder="Vendor details, billing invoice notes..."
            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Recording...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
