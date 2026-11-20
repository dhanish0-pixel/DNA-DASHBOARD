import api from './client';

export interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  purchase_price: number;
  unit_price: number;
  total_price: number;
  unit_cost: number;
  profit: number;
  formatted_unit_price?: string;
  formatted_total_price?: string;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  total_cost: number;
  total_profit: number;
  payment_method: string;
  status: string;
  notes?: string;
  user_id?: number;
  created_at: string;
  formatted_total?: string;
  formatted_profit?: string;
  items: SaleItem[];
}

export interface SaleListResponse {
  total: number;
  items: Sale[];
}

export interface SaleItemInput {
  product_id: number;
  quantity: number;
  unit_price?: number;
}

export interface SalePayload {
  customer_name?: string;
  customer_phone?: string;
  items: SaleItemInput[];
  discount_amount?: number;
  tax_amount?: number;
  payment_method?: string;
  notes?: string;
}

export const salesApi = {
  getSales: async (params?: { search?: string; payment_method?: string; status_filter?: string; limit?: number; offset?: number }): Promise<SaleListResponse> => {
    const res = await api.get('/sales', { params });
    return res.data;
  },

  getSale: async (id: number): Promise<Sale> => {
    const res = await api.get(`/sales/${id}`);
    return res.data;
  },

  createSale: async (payload: SalePayload): Promise<Sale> => {
    const res = await api.post('/sales', payload);
    return res.data;
  },

  deleteSale: async (id: number): Promise<{ message: string; invoice_number: string }> => {
    const res = await api.delete(`/sales/${id}`);
    return res.data;
  },
};
