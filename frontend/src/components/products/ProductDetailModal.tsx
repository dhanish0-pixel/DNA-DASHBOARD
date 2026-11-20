import React from 'react';
import { Modal } from '../common/Modal';
import type { Product } from '../../api/products';
import { formatINR, formatDate, getStockStatusConfig } from '../../utils/formatters';
import { Tag, Boxes, TrendingUp, DollarSign, Building2, Calendar, Barcode } from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onAdjustStock,
}) => {
  if (!product) return null;

  const status = getStockStatusConfig(product.stock_status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`SKU: ${product.sku}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Product Hero */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-36 h-36 bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src={product.image_url || '/uploads/products/lenovo_ideapad.svg'}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.badgeClass}`}>
                {status.label}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                {product.category?.name || 'General'}
              </span>
              {product.brand && (
                <span className="text-xs text-slate-500 font-medium">Brand: {product.brand}</span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>

            {product.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                Barcode: {product.barcode || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Added: {formatDate(product.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Valuation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Purchase Price
            </span>
            <span className="text-base font-bold text-slate-800">{formatINR(product.purchase_price)}</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Selling Price
            </span>
            <span className="text-base font-bold text-slate-900">{formatINR(product.selling_price)}</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Profit / Unit
            </span>
            <span className="text-base font-bold text-emerald-700">{formatINR(product.profit_per_unit)}</span>
            <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
              {product.profit_margin_percent}% Margin
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Stock Valuation
            </span>
            <span className="text-base font-bold text-blue-700">{formatINR(product.stock_valuation)}</span>
            <span className="text-[10px] font-semibold text-blue-600 block mt-0.5">
              {product.quantity} units in stock
            </span>
          </div>
        </div>

        {/* Stock & Supplier Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Boxes className="w-4 h-4 text-slate-500" />
              Inventory Status
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Units:</span>
                <span className="font-bold text-slate-900">{product.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Minimum Threshold:</span>
                <span className="font-semibold text-slate-700">{product.min_threshold} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory Status:</span>
                <span className={`font-bold ${status.badgeClass} px-2 py-0.5 rounded-md text-[11px]`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-slate-500" />
              Supplier Information
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier Name:</span>
                <span className="font-bold text-slate-900">{product.supplier?.name || 'Direct Procurement'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-semibold text-slate-700">{product.supplier?.contact_person || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-700">{product.supplier?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onAdjustStock?.(product);
            }}
            className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            Adjust Stock
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit?.(product);
              }}
              className="px-4.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
