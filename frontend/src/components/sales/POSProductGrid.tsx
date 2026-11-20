import React, { useState } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import type { Product, Category } from '../../api/products';
import { formatINR, getStockStatusConfig } from '../../utils/formatters';

interface POSProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  cartProductIds: number[];
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  categories,
  onAddToCart,
  cartProductIds,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Scan barcode, search product name, or SKU..."
            className="w-full bg-white text-xs text-slate-900 pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[680px] overflow-y-auto pr-1">
        {filteredProducts.map((p) => {
          const isOutOfStock = p.quantity <= 0;
          const isInCart = cartProductIds.includes(p.id);
          const status = getStockStatusConfig(p.stock_status);

          return (
            <div
              key={p.id}
              onClick={() => !isOutOfStock && onAddToCart(p)}
              className={`bg-white rounded-2xl p-3 border transition-all duration-150 flex flex-col justify-between ${
                isOutOfStock
                  ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                  : 'hover:border-blue-500 hover:shadow-md cursor-pointer border-slate-200/90 active:scale-98'
              }`}
            >
              {/* Image & Status dot */}
              <div className="relative w-full h-28 bg-slate-50/70 rounded-xl p-2 flex items-center justify-center mb-2">
                <span
                  className={`absolute top-2 left-2 w-2 h-2 rounded-full ${status.dotClass}`}
                  title={status.label}
                />
                <img
                  src={p.image_url || '/uploads/products/lenovo_ideapad.svg'}
                  alt={p.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              {/* Title & Price */}
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">{p.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{p.sku}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-900">{formatINR(p.selling_price)}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700'
                        : p.quantity <= p.min_threshold
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : `${p.quantity} in stock`}
                  </span>
                </div>
              </div>

              {/* Add to Cart button */}
              <button
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) onAddToCart(p);
                }}
                className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isInCart
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    In Cart
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
