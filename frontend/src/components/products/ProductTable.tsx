import React from 'react';
import { Eye, Edit2, Trash2, PlusCircle, ArrowUpDown } from 'lucide-react';
import type { Product } from '../../api/products';
import { formatINR, getStockStatusConfig } from '../../utils/formatters';

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onSort?: (field: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
  onAdjustStock,
  onSort,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-3.5 px-4">Product</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSort?.('sku')}>
                <div className="flex items-center gap-1">
                  SKU <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSort?.('quantity')}>
                <div className="flex items-center gap-1">
                  Stock Level <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSort?.('purchase_price')}>
                <div className="flex items-center gap-1">
                  Purchase Price <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSort?.('selling_price')}>
                <div className="flex items-center gap-1">
                  Selling Price <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Profit / Unit</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  No products found matching your search or filters.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const status = getStockStatusConfig(p.stock_status);
                const stockHealthPct = Math.min(100, Math.round((p.quantity / (p.min_threshold * 3 || 30)) * 100));

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Product Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || '/uploads/products/lenovo_ideapad.svg'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <p
                            onClick={() => onView(p)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate max-w-xs"
                          >
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{p.brand || 'Generic'}</p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{p.sku}</td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.category?.name || 'General'}
                      </span>
                    </td>

                    {/* Stock Level Bar */}
                    <td className="py-3 px-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-900">{p.quantity} units</span>
                          <span className="text-slate-400">Min: {p.min_threshold}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.quantity <= 0
                                ? 'bg-rose-500'
                                : p.quantity <= p.min_threshold
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, stockHealthPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Purchase Price */}
                    <td className="py-3 px-4 font-semibold text-slate-600">{formatINR(p.purchase_price)}</td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(p.selling_price)}</td>

                    {/* Profit per Unit & Margin */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-emerald-600">{formatINR(p.profit_per_unit)}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">{p.profit_margin_percent}% margin</p>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${status.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAdjustStock(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Quick Stock Adjustment"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
