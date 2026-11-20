import api from './client';

export interface KPITrend {
  percentage: number;
  is_positive: boolean;
  direction: 'up' | 'down' | 'neutral';
}

export interface KPIValue {
  value: number;
  formatted: string;
  trend?: KPITrend;
  previous_value?: number;
}

export interface DashboardSummary {
  time_frame: string;
  date_range: {
    start: string;
    end: string;
  };
  kpis: {
    revenue: KPIValue;
    gross_profit: KPIValue;
    net_profit: KPIValue;
    expenses: KPIValue;
    profit_margin: KPIValue;
    total_products: KPIValue;
    total_stock_units: KPIValue;
    inventory_purchase_value: KPIValue;
    low_stock_products: KPIValue;
    out_of_stock_products: KPIValue;
    in_stock_products: KPIValue;
  };
}

export interface RevenueProfitPoint {
  label: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  net_profit: number;
  expenses: number;
  formatted_revenue: string;
  formatted_gross_profit: string;
}

export interface TopProductItem {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  image_url?: string;
  units_sold: number;
  total_revenue: number;
  total_profit: number;
  formatted_revenue: string;
  formatted_profit: string;
}

export interface TopProductsResponse {
  best_selling: TopProductItem[];
  most_profitable: TopProductItem[];
}

export interface StockStatusAlert {
  id: number;
  name: string;
  sku: string;
  category: string;
  image_url?: string;
  quantity: number;
  min_threshold: number;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
  purchase_price: number;
  selling_price: number;
}

export interface StockStatusResponse {
  distribution: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    total: number;
  };
  alerts: StockStatusAlert[];
}

export const dashboardApi = {
  getSummary: async (timeFrame = 'month', startDate?: string, endDate?: string): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary', {
      params: { time_frame: timeFrame, start_date: startDate, end_date: endDate },
    });
    return res.data;
  },

  getRevenueChart: async (timeFrame = 'month'): Promise<RevenueProfitPoint[]> => {
    const res = await api.get('/dashboard/revenue', {
      params: { time_frame: timeFrame },
    });
    return res.data;
  },

  getTopProducts: async (): Promise<TopProductsResponse> => {
    const res = await api.get('/dashboard/top-products');
    return res.data;
  },

  getStockStatus: async (): Promise<StockStatusResponse> => {
    const res = await api.get('/dashboard/stock-status');
    return res.data;
  },
};
