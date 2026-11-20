import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  ShoppingCart,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch stock status alerts
  const { data: stockStatus } = useQuery({
    queryKey: ['stock-status'],
    queryFn: () => dashboardApi.getStockStatus(),
    refetchInterval: 15000,
  });

  const alerts = stockStatus?.alerts || [];
  const alertCount = alerts.length;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/stock':
        return 'Stock & Inventory Management';
      case '/sales':
        return 'Point of Sale & Transactions';
      case '/profit-revenue':
        return 'Revenue & Profit Analytics';
      case '/reports':
        return 'Financial Reports & Exports';
      case '/expenses':
        return 'Operating Expense Tracker';
      case '/settings':
        return 'Store Settings';
      default:
        return 'Store Management';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/stock?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Breadcrumb */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        <p className="text-xs text-slate-500 font-medium hidden sm:block">House of DNA · Style runs in your DNA</p>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search products, SKU, barcode..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-900 pl-9.5 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </form>

        {/* Quick Action: New Sale */}
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Sale</span>
        </button>

        {/* Quick Action: Add Product */}
        <button
          onClick={() => navigate('/stock?action=add')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Product</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Inventory Alerts"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Stock Alerts</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                    {alertCount} items
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 my-2">
                {alertCount === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">All products are healthy and in stock!</p>
                ) : (
                  alerts.slice(0, 5).map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.status === 'OUT_OF_STOCK' ? (
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertOctagon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Qty: <span className="font-bold text-slate-700">{item.quantity}</span> (Min: {item.min_threshold})
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          item.status === 'OUT_OF_STOCK'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {alertCount > 0 && (
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/stock?stock_status=low_stock');
                  }}
                  className="w-full mt-2 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  View All Alerts in Inventory
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="User"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name || 'Alex Carter'}</p>
            <p className="text-[10px] text-slate-400 leading-tight">apex-store.local</p>
          </div>
        </div>
      </div>
    </header>
  );
};
