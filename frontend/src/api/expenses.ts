import api from './client';

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  payment_method: string;
  reference_no?: string;
  user_id?: number;
  created_at: string;
  formatted_amount?: string;
}

export interface ExpenseListResponse {
  total: number;
  total_amount: number;
  formatted_total_amount: string;
  items: Expense[];
}

export interface ExpensePayload {
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  payment_method?: string;
  reference_no?: string;
}

export const expensesApi = {
  getExpenses: async (params?: { category?: string; start_date?: string; end_date?: string }): Promise<ExpenseListResponse> => {
    const res = await api.get('/expenses', { params });
    return res.data;
  },

  createExpense: async (payload: ExpensePayload): Promise<Expense> => {
    const res = await api.post('/expenses', payload);
    return res.data;
  },

  updateExpense: async (id: number, payload: Partial<ExpensePayload>): Promise<Expense> => {
    const res = await api.put(`/expenses/${id}`, payload);
    return res.data;
  },

  deleteExpense: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },

  getCategories: async (): Promise<string[]> => {
    const res = await api.get('/expenses/categories');
    return res.data;
  },
};
