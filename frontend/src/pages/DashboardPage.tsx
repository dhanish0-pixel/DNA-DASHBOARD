import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, TrendingDown, Package, Boxes,
  Archive, AlertTriangle, AlertOctagon, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { KPICard } from '../components/common/KPICard';
import { formatINR, formatINRShort } from '../utils/formatters';

const timeFrames = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

const STOCK_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-slate-800 mb-1.5">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-bold text-slate-900">{formatINR(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('month');
  const [revenueFrame, setRevenueFrame] = useState('month');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', timeFrame],
    queryFn: () => dashboardApi.getSummary(timeFrame),
    refetchInterval: 30000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue', revenueFrame],
    queryFn: () => dashboardApi.getRevenueChart(revenueFrame),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(),
  });

  const { data: stockStatus } = useQuery({
    queryKey: ['dashboard-stock-status'],
    queryFn: () => dashboardApi.getStockStatus(),
    refetchInterval: 15000,
  });

  const kpis = summary?.kpis;
  const pieData = stockStatus
    ? [
        { name: 'In Stock', value: stockStatus.distribution.in_stock },
        { name: 'Low Stock', value: stockStatus.distribution.low_stock },
        { name: 'Out of Stock', value: stockStatus.distribution.out_of_stock },
      ]
    : [];

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="space-y-6">
      {/* Time Frame Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Period: {summary?.date_range?.start} → {summary?.date_range?.end}
          </p>
        </div>

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
      </div>

      {/* KPI Cards Row 1 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={cardVariants}>
          <KPICard
            title="Total Revenue"
            value={isLoading ? '—' : (kpis?.revenue?.formatted ?? '₹0')}
            icon={DollarSign}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            trend={kpis?.revenue?.trend}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Gross Profit"
            value={isLoading ? '—' : (kpis?.gross_profit?.formatted ?? '₹0')}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            trend={kpis?.gross_profit?.trend}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Net Profit"
            value={isLoading ? '—' : (kpis?.net_profit?.formatted ?? '₹0')}
            icon={TrendingDown}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            trend={kpis?.net_profit?.trend}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Profit Margin"
            value={isLoading ? '—' : (kpis?.profit_margin?.formatted ?? '0%')}
            icon={TrendingUp}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            badge="margin"
            badgeColor="bg-violet-100 text-violet-700"
          />
        </motion.div>
      </motion.div>

      {/* KPI Cards Row 2 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={cardVariants}>
          <KPICard
            title="Total Products"
            value={isLoading ? '—' : (kpis?.total_products?.formatted ?? '0')}
            icon={Package}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Stock Units"
            value={isLoading ? '—' : (kpis?.total_stock_units?.formatted ?? '0')}
            icon={Boxes}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Inventory Value"
            value={isLoading ? '—' : (kpis?.inventory_purchase_value?.formatted ?? '₹0')}
            icon={Archive}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <KPICard
            title="Low / Out of Stock"
            value={isLoading ? '—' : `${kpis?.low_stock_products?.value ?? 0} / ${kpis?.out_of_stock_products?.value ?? 0}`}
            icon={AlertTriangle}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            badge="Needs Attention"
            badgeColor="bg-rose-100 text-rose-700"
          />
        </motion.div>
      </motion.div>

      {/* Revenue & Profit Chart + Stock Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue vs Profit Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue, gross profit and net profit</p>
            </div>
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
              {['week', 'month', 'year'].map((f) => (
                <button
                  key={f}
                  onClick={() => setRevenueFrame(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all capitalize ${
                    revenueFrame === f ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'week' ? 'Week' : f === 'month' ? '6 Months' : 'Year'}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatINRShort(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="gross_profit" name="Gross Profit" stroke="#10B981" strokeWidth={2} fill="url(#profGrad)" dot={false} />
              <Area type="monotone" dataKey="net_profit" name="Net Profit" stroke="#8B5CF6" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Stock Health</h3>
          <p className="text-xs text-slate-500 mb-4">Current inventory availability split</p>

          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={STOCK_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Products']} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {[
              { label: 'In Stock', value: stockStatus?.distribution.in_stock ?? 0, color: 'bg-emerald-500' },
              { label: 'Low Stock', value: stockStatus?.distribution.low_stock ?? 0, color: 'bg-amber-500' },
              { label: 'Out of Stock', value: stockStatus?.distribution.out_of_stock ?? 0, color: 'bg-rose-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Top 5 Best-Selling Products</h3>
          <div className="space-y-3">
            {(topProducts?.best_selling ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales data yet. Record your first sale!</p>
            ) : (
              topProducts?.best_selling.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.category} · {p.units_sold} units sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">{p.formatted_revenue}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">+{p.formatted_profit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            Stock Alerts
          </h3>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {(stockStatus?.alerts ?? []).length === 0 ? (
              <p className="text-xs text-emerald-600 font-semibold py-4 text-center bg-emerald-50 rounded-xl">
                ✓ All products are healthy — no stock alerts!
              </p>
            ) : (
              stockStatus?.alerts.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    item.status === 'OUT_OF_STOCK'
                      ? 'bg-rose-50 border-rose-100'
                      : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Qty: <strong>{item.quantity}</strong> · Min: {item.min_threshold}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      item.status === 'OUT_OF_STOCK'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
