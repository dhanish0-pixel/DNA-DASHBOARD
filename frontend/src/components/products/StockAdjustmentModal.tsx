import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { productsApi, type Product } from '../../api/products';
import { Plus, Minus, CheckCircle } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('Restock shipment from supplier');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!product) return null;

  const finalChange = adjustmentType === 'ADD' ? amount : -amount;
  const newQuantity = Math.max(0, product.quantity + finalChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Please specify a positive adjustment amount');
      return;
    }
    if (adjustmentType === 'DEDUCT' && amount > product.quantity) {
      setErrorMsg(`Cannot deduct more than currently available stock (${product.quantity})`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await productsApi.adjustStock(product.id, finalChange, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Adjustment"
      subtitle={`Adjusting stock level for ${product.name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Current vs New preview */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Current Qty</span>
            <span className="text-xl font-bold text-slate-800">{product.quantity}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">New Qty</span>
            <span
              className={`text-xl font-bold ${
                newQuantity <= product.min_threshold ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {newQuantity}
            </span>
          </div>
        </div>

        {/* Add / Deduct toggle buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAdjustmentType('ADD');
              setReason('Restock shipment from supplier');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              adjustmentType === 'ADD'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stock (+)
          </button>
          <button
            type="button"
            onClick={() => {
              setAdjustmentType('DEDUCT');
              setReason('Damaged / Defective write-off');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              adjustmentType === 'DEDUCT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            Deduct Stock (-)
          </button>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Adjust</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Reason selector / input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-2 focus:bg-white focus:outline-none"
          >
            {adjustmentType === 'ADD' ? (
              <>
                <option value="Restock shipment from supplier">Restock shipment from supplier</option>
                <option value="Customer return / restock">Customer return / restock</option>
                <option value="Inventory audit surplus">Inventory audit surplus</option>
                <option value="Other Addition">Other Addition</option>
              </>
            ) : (
              <>
                <option value="Damaged / Defective write-off">Damaged / Defective write-off</option>
                <option value="Expired / Obsolete stock removal">Expired / Obsolete stock removal</option>
                <option value="Inventory audit shortage / theft">Inventory audit shortage / theft</option>
                <option value="Internal showroom demo sample">Internal showroom demo sample</option>
                <option value="Other Deduction">Other Deduction</option>
              </>
            )}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 ${
              adjustmentType === 'ADD'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting ? 'Applying...' : 'Save Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
