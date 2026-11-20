import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, LayoutGrid, List, Search, SlidersHorizontal,
  Package, ArrowUpDown, RefreshCw
} from 'lucide-react';
import { productsApi, type Product, type Category, type Supplier } from '../api/products';
import { ProductCard } from '../components/products/ProductCard';
import { ProductTable } from '../components/products/ProductTable';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { StockAdjustmentModal } from '../components/products/StockAdjustmentModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

type ViewMode = 'grid' | 'list';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export const StockPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stockFilter, setStockFilter] = useState<StockFilter>((searchParams.get('stock_status') as StockFilter) || 'all');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch products
  const { data: productList, isLoading, refetch } = useQuery({
    queryKey: ['products', search, stockFilter, categoryFilter, sortBy, sortOrder],
    queryFn: () => productsApi.getProducts({
      search: search || undefined,
      stock_status: stockFilter,
      category_id: categoryFilter,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => productsApi.getSuppliers(),
  });

  const products = productList?.items ?? [];
  const total = productList?.total ?? 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stock-status'] });
    queryClient.invalidateQueries({ queryKey: ['stock-status'] });
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      setDeleting(true);
      await productsApi.deleteProduct(deleteProduct.id);
      invalidate();
      setDeleteProduct(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const stockFilters: { id: StockFilter; label: string; color: string }[] = [
    { id: 'all', label: 'All Products', color: 'bg-slate-800 text-white' },
    { id: 'in_stock', label: 'In Stock', color: 'bg-emerald-600 text-white' },
    { id: 'low_stock', label: 'Low Stock', color: 'bg-amber-500 text-white' },
    { id: 'out_of_stock', label: 'Out of Stock', color: 'bg-rose-600 text-white' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products & Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">{total} products in database</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        {/* Search + Sort + View toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, barcode or brand..."
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2.5 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Category filter */}
            <select
              value={categoryFilter ?? ''}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="selling_price-desc">Price (High-Low)</option>
              <option value="selling_price-asc">Price (Low-High)</option>
              <option value="quantity-asc">Stock (Low-High)</option>
              <option value="quantity-desc">Stock (High-Low)</option>
            </select>

            {/* View Toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Status Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {stockFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStockFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                stockFilter === f.id
                  ? f.color + ' shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters, or add your first product.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Add First Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onView={setViewProduct}
              onEdit={setEditProduct}
              onDelete={setDeleteProduct}
              onAdjustStock={setAdjustProduct}
            />
          ))}
        </motion.div>
      ) : (
        <ProductTable
          products={products}
          onView={setViewProduct}
          onEdit={setEditProduct}
          onDelete={setDeleteProduct}
          onAdjustStock={setAdjustProduct}
          onSort={(field) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field);
              setSortOrder('desc');
            }
          }}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        product={null}
        categories={categories}
        suppliers={suppliers}
        onSuccess={invalidate}
      />
      <ProductFormModal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        categories={categories}
        suppliers={suppliers}
        onSuccess={invalidate}
      />
      <ProductDetailModal
        isOpen={!!viewProduct}
        onClose={() => setViewProduct(null)}
        product={viewProduct}
        onEdit={(p) => { setViewProduct(null); setEditProduct(p); }}
        onAdjustStock={(p) => { setViewProduct(null); setAdjustProduct(p); }}
      />
      <StockAdjustmentModal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onSuccess={invalidate}
      />
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? If this product has sales history, it will be archived instead to protect your financial records.`}
        confirmLabel="Delete Product"
        isDangerous
        loading={deleting}
      />
    </div>
  );
};
