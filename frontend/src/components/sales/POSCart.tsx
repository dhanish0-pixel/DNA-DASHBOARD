import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  User,
  Phone,
  Tag,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';
import type { Product } from '../../api/products';
import type { Sale, SalePayload } from '../../api/sales';
import { formatINR } from '../../utils/formatters';

export interface CartItem {
  product: Product;
  quantity: number;
  custom_price?: number;
}

interface POSCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, newQty: number) => void;
  onUpdatePrice: (productId: number, newPrice: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: (payload: SalePayload) => Promise<Sale | null>;
  isCheckingOut: boolean;
}

export const POSCart: React.FC<POSCartProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckingOut,
}) => {
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getItemPrice = (item: CartItem) =>
    item.custom_price !== undefined ? item.custom_price : item.product.selling_price;

  // Subtotal & Cost calculations
  const subtotal = cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.product.purchase_price * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - (discountAmount || 0));
  const estimatedProfit = finalTotal - totalCost;

  const paymentOptions = [
    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'Credit Card', label: 'Card', icon: CreditCard },
  ];

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      setErrorMsg('Please add at least one product to the sale cart');
      return;
    }

    try {
      setErrorMsg(null);
      const payload: SalePayload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: getItemPrice(item),
        })),
        discount_amount: Number(discountAmount) || 0,
        tax_amount: 0,
        payment_method: paymentMethod,
        notes: notes || undefined,
      };

      await onCheckout(payload);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Transaction failed');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-full justify-between">
      {/* Cart Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current Sale</h3>
            <p className="text-[11px] text-slate-400">{cart.length} item{cart.length === 1 ? '' : 's'} in checkout</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Cart Items List */}
        <div className="my-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="font-semibold text-slate-500 mb-1">Your cart is empty</p>
              <p>Click on products in the catalog to add them to this sale.</p>
            </div>
          ) : (
            cart.map((item) => {
              const currentPrice = getItemPrice(item);
              return (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                    
                    {/* Price editor and calculation */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-600">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={currentPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdatePrice(item.product.id, isNaN(val) ? 0 : val);
                        }}
                        className="w-20 px-1.5 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
                        title="Click to change selling price for this transaction"
                      />
                      <span>× {item.quantity} = </span>
                      <strong className="text-slate-800 font-bold">
                        {formatINR(currentPrice * item.quantity)}
                      </strong>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.quantity}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-30"
                      title={item.quantity >= item.product.quantity ? 'Max available stock reached' : 'Add one'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Details Form */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Discount & Payment Method */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Discount (₹)</label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0.00"
                  className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Method</label>
              <div className="flex gap-1">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                        paymentMethod === opt.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Summary & Final Checkout */}
      <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">{formatINR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>- {formatINR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>Estimated Profit</span>
            <span className="font-semibold text-emerald-600">+{formatINR(estimatedProfit)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
            <span className="text-sm font-bold">Total Payable</span>
            <span className="text-xl font-bold tracking-tight text-blue-600">
              {formatINR(finalTotal)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckoutSubmit}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {isCheckingOut ? (
            <span>Processing Sale...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Complete Sale & Print Receipt
            </>
          )}
        </button>
      </div>
    </div>
  );
};
