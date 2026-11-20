import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  BarChart3, Download, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { reportsApi } from '../api/reports';
import { formatINR, formatINRShort } from '../utils/formatters';

const timeFrames = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

export const ProfitRevenuePage: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('month');

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', timeFrame],
    queryFn: () => dashboardApi.getSummary(timeFrame),
  });

  const { data: profitReport } = useQuery({
    queryKey: ['profit-report', timeFrame],
    queryFn: () => reportsApi.getProfitReport(timeFrame),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(),
  });

  const kpis = summary?.kpis;

  const profitMetrics = profitReport
    ? [
        { label: 'Total Revenue', value: profitReport.total_revenue, formatted: profitReport.formatted_revenue, color: '#3B82F6', Icon: DollarSign, positive: true },
        { label: 'Cost of Goods Sold', value: profitReport.total_cogs, formatted: profitReport.formatted_cogs, color: '#EF4444', Icon: ShoppingBag, positive: false },
        { label: 'Gross Profit', value: profitReport.gross_profit, formatted: profitReport.formatted_gross_profit, color: '#10B981', Icon: TrendingUp, positive: true },
        { label: 'Operating Expenses', value: profitReport.operating_expenses, formatted: profitReport.formatted_expenses, color: '#F59E0B', Icon: TrendingDown, positive: false },
        { label: 'Net Profit', value: profitReport.net_profit, formatted: profitReport.formatted_net_profit, color: '#8B5CF6', Icon: BarChart3, positive: profitReport.net_profit >= 0 },
      ]
    : [];

  const categoryData = (profitReport?.category_profitability ?? []).slice(0, 7).map((c) => ({
    name: c.category.length > 14 ? c.category.substring(0, 12) + '…' : c.category,
    Revenue: c.revenue,
    Profit: c.gross_profit,
    Margin: c.margin_percent,
  }));

  const profitPieData = (topProducts?.most_profitable ?? []).map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 13) + '…' : p.name,
    value: p.total_profit,
  }));

  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
              <span className="text-slate-500">{p.name}:</span>
              <span className="font-bold text-slate-900">{formatINR(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Revenue & Profit Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Period: {summary?.date_range?.start ?? '—'} → {summary?.date_range?.end ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            {timeFrames.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeFrame(tf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeFrame === tf.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <a
            href={reportsApi.getExportCsvUrl('sales')}
            download
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* P&L Statement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {profitMetrics.map((m) => {
          const Icon = m.Icon;
          return (
            <motion.div
              key={m.label}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{m.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.color + '15' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{m.formatted ?? '₹0'}</p>
              <div className="flex items-center gap-1 mt-1">
                {m.positive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span className={`text-[11px] font-semibold ${m.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.positive ? 'Positive' : 'Outflow'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Margin Indicators */}
      {profitReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Gross Profit Margin</p>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {profitReport.gross_margin_percent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, profitReport.gross_margin_percent)}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Revenue: {profitReport.formatted_revenue} · COGS: {profitReport.formatted_cogs}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Net Profit Margin</p>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${
                profitReport.net_margin_percent >= 0
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-100'
                  : 'text-rose-700 bg-rose-50 border-rose-100'
              }`}>
                {profitReport.net_margin_percent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, Math.min(100, Math.abs(profitReport.net_margin_percent)))}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${profitReport.net_margin_percent >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">After expenses: {profitReport.formatted_expenses} deducted</p>
          </div>
        </div>
      )}

      {/* Category Profitability Chart + Top Profitable Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Profitability by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No category data available. Record sales to see breakdown.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis tickFormatter={(v) => formatINRShort(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" name="Gross Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Profitable Products Pie */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Most Profitable Products</h3>
          {profitPieData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No sales recorded yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={profitPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {profitPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatINR(v), 'Profit']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {topProducts?.most_profitable.slice(0, 5).map((p, i) => (
                  <div key={p.product_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-700 font-medium truncate max-w-[140px]">{p.name}</span>
                    </div>
                    <span className="font-bold text-emerald-600">{p.formatted_profit}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
