import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, History, CheckCircle, AlertCircle } from 'lucide-react';
import { productsApi } from '../api/products';
import { salesApi, type Sale, type SalePayload } from '../api/sales';
import { POSProductGrid } from '../components/sales/POSProductGrid';
import { POSCart, type CartItem } from '../components/sales/POSCart';
import { SalesHistoryTable } from '../components/sales/SalesHistoryTable';
import { ReceiptModal } from '../components/sales/ReceiptModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

type SalesTab = 'pos' | 'history';

export const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesTab>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: productList } = useQuery({
    queryKey: ['products', '', 'all'],
    queryFn: () => productsApi.getProducts({ sort_by: 'name', sort_order: 'asc' }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const { data: salesList, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getSales({ limit: 200 }),
    enabled: activeTab === 'history',
  });

  const products = productList?.items ?? [];
  const sales = salesList?.items ?? [];

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > product.quantity) {
          showToast('error', `Only ${product.quantity} units of "${product.name}" available`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: 1, custom_price: product.selling_price }];
    });
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    const cartItem = cart.find((item) => item.product.id === productId);
    if (cartItem && newQty > cartItem.product.quantity) {
      showToast('error', `Max available stock is ${cartItem.product.quantity}`);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdatePrice = (productId: number, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, custom_price: newPrice } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => setCart([]);

  const handleCheckout = async (payload: SalePayload): Promise<Sale | null> => {
    try {
      setCheckingOut(true);
      const sale = await salesApi.createSale(payload);
      setLastSale(sale);
      setCart([]);
      setShowReceipt(true);
      showToast('success', `Sale ${sale.invoice_number} completed successfully!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stock-status'] });
      queryClient.invalidateQueries({ queryKey: ['stock-status'] });
      return sale;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Sale failed. Please try again.';
      showToast('error', message);
      return null;
    } finally {
      setCheckingOut(false);
    }
  };

  const handleConfirmDeleteSale = async () => {
    if (!saleToDelete) return;
    try {
      setIsDeleting(true);
      const res = await salesApi.deleteSale(saleToDelete.id);
      showToast('success', res.message || `Transaction ${saleToDelete.invoice_number} deleted and stock restored.`);
      setSaleToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stock-status'] });
      queryClient.invalidateQueries({ queryKey: ['stock-status'] });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete transaction.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Point of sale · Transaction history · Invoicing</p>
        </div>

        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pos' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            New Sale
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Transaction History
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* POS View */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Product Catalog */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Product Catalog</h3>
            <POSProductGrid
              products={products}
              categories={categories}
              onAddToCart={handleAddToCart}
              cartProductIds={cart.map((i) => i.product.id)}
            />
          </div>

          {/* Cart & Checkout */}
          <div className="xl:col-span-1">
            <POSCart
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdatePrice={handleUpdatePrice}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              isCheckingOut={checkingOut}
            />
          </div>
        </div>
      )}

      {/* Transaction History View */}
      {activeTab === 'history' && (
        <SalesHistoryTable
          sales={sales}
          isLoading={salesLoading}
          onViewReceipt={(sale) => {
            setLastSale(sale);
            setShowReceipt(true);
          }}
          onDeleteSale={(sale) => setSaleToDelete(sale)}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={lastSale}
      />

      {/* Confirm Delete Transaction Modal */}
      <ConfirmDialog
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleConfirmDeleteSale}
        title="Delete Transaction"
        message={`Are you sure you want to delete invoice "${saleToDelete?.invoice_number}"? This will reverse the sale, restore all sold product quantities back to your inventory stock, and permanently delete this transaction.`}
        confirmLabel="Delete & Restore Stock"
        isDangerous={true}
        loading={isDeleting}
      />
    </div>
  );
};
