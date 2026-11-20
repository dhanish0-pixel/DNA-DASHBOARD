import api from './client';

export interface SalesReport {
  generated_at: string;
  period: string;
  total_sales_count: number;
  total_items_sold: number;
  total_revenue: number;
  total_discount: number;
  total_tax: number;
  formatted_total_revenue: string;
  daily_breakdown: Array<{
    date: string;
    revenue: number;
    profit: number;
    orders: number;
    formatted_revenue: string;
    formatted_profit: string;
  }>;
  payment_method_breakdown: Array<{
    method: string;
    amount: number;
    formatted_amount: string;
  }>;
}

export interface ProfitReport {
  generated_at: string;
  period: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
  gross_margin_percent: number;
  net_margin_percent: number;
  formatted_revenue: string;
  formatted_cogs: string;
  formatted_gross_profit: string;
  formatted_expenses: string;
  formatted_net_profit: string;
  category_profitability: Array<{
    category: string;
    revenue: number;
    gross_profit: number;
    margin_percent: number;
    formatted_revenue: string;
    formatted_profit: string;
  }>;
}

export interface InventoryReport {
  generated_at: string;
  total_products: number;
  total_stock_units: number;
  total_purchase_value: number;
  total_potential_revenue: number;
  potential_gross_profit: number;
  formatted_purchase_value: string;
  formatted_potential_revenue: string;
  formatted_potential_profit: string;
  stock_status_breakdown: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };
  slow_moving_products: Array<{
    id: number;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    sold_last_30_days: number;
    tied_up_capital: number;
    formatted_capital: string;
  }>;
  out_of_stock_products: Array<{
    id: number;
    name: string;
    sku: string;
    category: string;
    purchase_price: number;
    selling_price: number;
    formatted_price: string;
    min_threshold: number;
  }>;
}

export const reportsApi = {
  getSalesReport: async (timeFrame = 'month', startDate?: string, endDate?: string): Promise<SalesReport> => {
    const res = await api.get('/reports/sales', {
      params: { time_frame: timeFrame, start_date: startDate, end_date: endDate },
    });
    return res.data;
  },

  getProfitReport: async (timeFrame = 'month', startDate?: string, endDate?: string): Promise<ProfitReport> => {
    const res = await api.get('/reports/profit', {
      params: { time_frame: timeFrame, start_date: startDate, end_date: endDate },
    });
    return res.data;
  },

  getInventoryReport: async (): Promise<InventoryReport> => {
    const res = await api.get('/reports/inventory');
    return res.data;
  },

  getExportCsvUrl: (reportType: 'sales' | 'products' | 'expenses') => {
    return `/api/reports/export/csv?report_type=${reportType}`;
  },
};
