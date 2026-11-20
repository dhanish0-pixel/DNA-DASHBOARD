import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart2, Package, Calendar } from 'lucide-react';
import { reportsApi } from '../api/reports';
import { formatINR, formatDate } from '../utils/formatters';

const timeFrames = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

type ReportTab = 'sales' | 'profit' | 'inventory';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [timeFrame, setTimeFrame] = useState('month');

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', timeFrame],
    queryFn: () => reportsApi.getSalesReport(timeFrame),
    enabled: activeTab === 'sales',
  });

  const { data: profitReport, isLoading: profitLoading } = useQuery({
    queryKey: ['report-profit', timeFrame],
    queryFn: () => reportsApi.getProfitReport(timeFrame),
    enabled: activeTab === 'profit',
  });

  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => reportsApi.getInventoryReport(),
    enabled: activeTab === 'inventory',
  });

  const tabs = [
    { id: 'sales' as ReportTab, label: 'Sales Report', icon: FileText },
    { id: 'profit' as ReportTab, label: 'Profit Report', icon: BarChart2 },
    { id: 'inventory' as ReportTab, label: 'Inventory Report', icon: Package },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate, view, and export business reports</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={reportsApi.getExportCsvUrl('sales')} download className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Sales CSV
          </a>
          <a href={reportsApi.getExportCsvUrl('products')} download className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Products CSV
          </a>
          <a href={reportsApi.getExportCsvUrl('expenses')} download className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Expenses CSV
          </a>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Time Frame Selector (not for inventory) */}
      {activeTab !== 'inventory' && (
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs w-fit">
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
      )}

      {/* Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {salesLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 h-48 animate-pulse" />
          ) : salesReport ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Transactions', value: salesReport.total_sales_count.toString(), color: 'text-blue-600' },
                  { label: 'Items Sold', value: salesReport.total_items_sold.toString(), color: 'text-indigo-600' },
                  { label: 'Total Revenue', value: salesReport.formatted_total_revenue, color: 'text-emerald-600' },
                  { label: 'Total Discounts', value: formatINR(salesReport.total_discount), color: 'text-amber-600' },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">Daily Sales Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Period: {salesReport.period}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Orders</th>
                        <th className="py-3 px-4">Revenue</th>
                        <th className="py-3 px-4">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesReport.daily_breakdown.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">No sales data for this period</td></tr>
                      ) : (
                        salesReport.daily_breakdown.map((day) => (
                          <tr key={day.date} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-700">{formatDate(day.date)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">{day.orders}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">{day.formatted_revenue}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">+{day.formatted_profit}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Method Split */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Payment Method Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {salesReport.payment_method_breakdown.map((pm) => (
                    <div key={pm.method} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-700">{pm.method}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">{pm.formatted_amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Profit Report */}
      {activeTab === 'profit' && (
        <div className="space-y-5">
          {profitLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 h-48 animate-pulse" />
          ) : profitReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { label: 'Revenue', value: profitReport.formatted_revenue, color: 'border-blue-500 bg-blue-50' },
                  { label: 'COGS', value: profitReport.formatted_cogs, color: 'border-rose-400 bg-rose-50' },
                  { label: 'Gross Profit', value: profitReport.formatted_gross_profit, color: 'border-emerald-500 bg-emerald-50' },
                  { label: 'Expenses', value: profitReport.formatted_expenses, color: 'border-amber-500 bg-amber-50' },
                  { label: 'Net Profit', value: profitReport.formatted_net_profit, color: profitReport.net_profit >= 0 ? 'border-indigo-500 bg-indigo-50' : 'border-rose-600 bg-rose-50' },
                ].map((m) => (
                  <div key={m.label} className={`bg-white rounded-2xl border-l-4 ${m.color} shadow-xs p-4`}>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">{m.label}</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Gross Margin</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-emerald-600">{profitReport.gross_margin_percent.toFixed(2)}%</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, profitReport.gross_margin_percent)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Net Margin</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${profitReport.net_margin_percent >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {profitReport.net_margin_percent.toFixed(2)}%
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${profitReport.net_margin_percent >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${Math.max(5, Math.min(100, Math.abs(profitReport.net_margin_percent)))}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Profitability */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">Profitability by Product Category</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Revenue</th>
                        <th className="py-3 px-4">Gross Profit</th>
                        <th className="py-3 px-4">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profitReport.category_profitability.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">No data for this period</td></tr>
                      ) : (
                        profitReport.category_profitability.map((c) => (
                          <tr key={c.category} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">{c.category}</td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{c.formatted_revenue}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">{c.formatted_profit}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, c.margin_percent)}%` }} />
                                </div>
                                <span className="font-bold text-slate-700">{c.margin_percent.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          {inventoryLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 h-48 animate-pulse" />
          ) : inventoryReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Products', value: inventoryReport.total_products.toString(), color: 'text-blue-600' },
                  { label: 'Total Stock Units', value: inventoryReport.total_stock_units.toLocaleString('en-IN'), color: 'text-indigo-600' },
                  { label: 'Purchase Value (Tied Capital)', value: inventoryReport.formatted_purchase_value, color: 'text-amber-600' },
                  { label: 'Potential Revenue', value: inventoryReport.formatted_potential_revenue, color: 'text-emerald-600' },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Out of Stock */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-rose-50/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-bold text-rose-800">Out of Stock Products ({inventoryReport.out_of_stock_products.length})</h3>
                  </div>
                  <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {inventoryReport.out_of_stock_products.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-semibold text-center py-4">✓ All products are in stock!</p>
                    ) : (
                      inventoryReport.out_of_stock_products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-100 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-slate-500 font-mono">{p.sku} · Min: {p.min_threshold}</p>
                          </div>
                          <span className="font-bold text-slate-700">{p.formatted_price}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Slow Moving */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-amber-50/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-bold text-amber-800">Slow-Moving Products ({inventoryReport.slow_moving_products.length})</h3>
                  </div>
                  <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {inventoryReport.slow_moving_products.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-semibold text-center py-4">✓ Inventory is moving well!</p>
                    ) : (
                      inventoryReport.slow_moving_products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-slate-500">{p.sold_last_30_days} sold (30d) · {p.quantity} in stock</p>
                          </div>
                          <span className="font-bold text-amber-700">{p.formatted_capital}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
