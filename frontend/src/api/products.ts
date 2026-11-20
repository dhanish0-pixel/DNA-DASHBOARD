import api from './client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  supplier_id?: number;
  image_url?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_threshold: number;
  brand?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  profit_per_unit: number;
  profit_margin_percent: number;
  stock_valuation: number;
  formatted_purchase_price?: string;
  formatted_selling_price?: string;
  category?: Category;
  supplier?: Supplier;
}

export interface ProductListResponse {
  total: number;
  items: Product[];
}

export interface ProductFilterParams {
  search?: string;
  category_id?: number;
  stock_status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ProductPayload {
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  supplier_id?: number | null;
  image_url?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_threshold: number;
  brand?: string;
  description?: string;
  is_active?: boolean;
}

export const productsApi = {
  getProducts: async (params?: ProductFilterParams): Promise<ProductListResponse> => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (payload: ProductPayload): Promise<Product> => {
    const res = await api.post('/products', payload);
    return res.data;
  },

  updateProduct: async (id: number, payload: Partial<ProductPayload>): Promise<Product> => {
    const res = await api.put(`/products/${id}`, payload);
    return res.data;
  },

  deleteProduct: async (id: number): Promise<{ message: string; archived: boolean }> => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  adjustStock: async (id: number, quantityChange: number, reason: string): Promise<Product> => {
    const res = await api.post(`/products/${id}/adjust-stock`, {
      quantity_change: quantityChange,
      reason,
      movement_type: quantityChange >= 0 ? 'PURCHASE' : 'ADJUSTMENT',
    });
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ image_url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data;
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    const res = await api.get('/suppliers');
    return res.data;
  },
};
