import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Filter, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';
import { expensesApi, type Expense } from '../api/expenses';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatINR, formatDate } from '../utils/formatters';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data: expenseList, isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: () => expensesApi.getExpenses({ category: categoryFilter || undefined }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.getCategories(),
  });

  const expenses = expenseList?.items ?? [];
  const totalAmount = expenseList?.total_amount ?? 0;

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteExpense) return;
    try {
      setDeleting(true);
      await expensesApi.deleteExpense(deleteExpense.id);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setDeleteExpense(null);
      showToast('success', 'Expense deleted successfully');
    } catch {
      showToast('error', 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  // Group expenses by category for the summary chart
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const expenseCategoryColors: Record<string, string> = {
    'Rent & Lease': 'bg-blue-500',
    'Staff Salaries': 'bg-indigo-500',
    'Utilities & Electricity': 'bg-cyan-500',
    'Marketing & Advertising': 'bg-violet-500',
    'Logistics & Shipping': 'bg-orange-500',
    'Maintenance & Repairs': 'bg-amber-500',
    'Store Supplies': 'bg-teal-500',
    'Taxes & Licenses': 'bg-rose-500',
    'Software & Subscriptions': 'bg-purple-500',
    'Miscellaneous': 'bg-slate-500',
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Operating Expenses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track business costs · Auto-deducted from Net Profit calculations
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 col-span-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Expenses (Filtered)</p>
          <p className="text-2xl font-bold text-rose-600">{formatINR(totalAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} expense records</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Top Category</p>
          <p className="text-sm font-bold text-slate-800">{topCategories[0]?.[0] || 'None'}</p>
          <p className="text-xs text-rose-500 font-bold mt-1">{topCategories[0] ? formatINR(topCategories[0][1]) : '₹0'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Avg per Entry</p>
          <p className="text-sm font-bold text-slate-800">
            {expenses.length > 0 ? formatINR(totalAmount / expenses.length) : '₹0'}
          </p>
          <p className="text-xs text-slate-400 mt-1">per expense entry</p>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {topCategories.map(([cat, amt]) => {
              const pct = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
              const colorClass = expenseCategoryColors[cat] || 'bg-slate-400';
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                      <span className="font-semibold text-slate-700">{cat}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-slate-500">{pct}%</span>
                      <span className="font-bold text-slate-900 w-28 text-right">{formatINR(amt)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`h-full rounded-full ${colorClass}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter + Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Expense History</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none shadow-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Expense Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <IndianRupee className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium">No expenses recorded yet</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-3 text-blue-600 hover:underline text-xs font-semibold"
                    >
                      Record your first expense →
                    </button>
                  </td>
                </tr>
              ) : (
                expenses.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${expenseCategoryColors[e.category] || 'bg-slate-400'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">{formatINR(e.amount)}</td>
                    <td className="py-3 px-4 text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(e.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {e.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{e.reference_no || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteExpense(e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ExpenseFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          showToast('success', 'Expense recorded successfully');
        }}
      />
      <ConfirmDialog
        isOpen={!!deleteExpense}
        onClose={() => setDeleteExpense(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to permanently delete "${deleteExpense?.title}" (${formatINR(deleteExpense?.amount ?? 0)})?`}
        confirmLabel="Delete Expense"
        isDangerous
        loading={deleting}
      />
    </div>
  );
};
