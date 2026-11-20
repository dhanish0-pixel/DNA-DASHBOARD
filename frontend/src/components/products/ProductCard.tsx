import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, Eye, PlusCircle } from 'lucide-react';
import type { Product } from '../../api/products';
import { formatINR, getStockStatusConfig } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  onAdjustStock,
  onAddToCart,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusConfig = getStockStatusConfig(product.stock_status);

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col relative group"
    >
      {/* Top Bar with Status Dot & 3-Dots Menu */}
      <div className="p-3.5 pb-0 flex items-center justify-between z-10">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusConfig.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
          {statusConfig.label}
        </span>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onView(product);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(product);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  Edit Product
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAdjustStock(product);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  Adjust Stock
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(product);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Image */}
      <div
        onClick={() => onView(product)}
        className="w-full h-44 p-4 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
      >
        <img
          src={product.image_url || '/uploads/products/lenovo_ideapad.svg'}
          alt={product.name}
          className="max-h-full max-w-full object-contain drop-shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Product Content Details */}
      <div className="p-4 pt-1 flex-1 flex flex-col justify-between">
        <div>
          {/* Price & Original Price */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {formatINR(product.selling_price)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {formatINR(product.selling_price * 1.2)}
            </span>
          </div>

          {/* Product Name */}
          <h4
            onClick={() => onView(product)}
            className="text-sm font-bold text-slate-800 leading-snug hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
            title={product.name}
          >
            {product.name}
          </h4>

          {/* Category & Brand */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Category: <strong className="text-slate-700 font-medium">{product.category?.name || 'General'}</strong></span>
            {product.brand && (
              <>
                <span className="text-slate-300">•</span>
                <span>Brand: <strong className="text-slate-700 font-medium">{product.brand}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Footer: Supplier avatar & Quantity Badge */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                product.supplier?.contact_person || product.supplier?.name || 'Supplier'
              )}`}
              alt="Supplier"
              className="w-6 h-6 rounded-full bg-slate-100 ring-1 ring-slate-200 shrink-0"
            />
            <span className="text-xs text-slate-600 truncate max-w-[90px]">
              {product.supplier?.contact_person || product.supplier?.name || 'Direct'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                product.quantity <= 0
                  ? 'bg-rose-100 text-rose-700'
                  : product.quantity <= product.min_threshold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              Qty: {product.quantity}
            </span>

            {onAddToCart && product.quantity > 0 && (
              <button
                onClick={() => onAddToCart(product)}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors"
                title="Add to Sale"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
