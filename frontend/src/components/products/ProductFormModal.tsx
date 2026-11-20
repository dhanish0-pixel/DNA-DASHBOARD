import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, DollarSign, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { productsApi, type Product, type Category, type Supplier } from '../../api/products';
import { formatINR } from '../../utils/formatters';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional(),
  category_id: z.coerce.number().min(1, 'Please select a category'),
  supplier_id: z.coerce.number().nullable().optional(),
  brand: z.string().optional(),
  purchase_price: z.coerce.number().min(0, 'Purchase price must be positive'),
  selling_price: z.coerce.number().min(0, 'Selling price must be positive'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  min_threshold: z.coerce.number().int().min(0, 'Threshold cannot be negative'),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  suppliers,
  onSuccess,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category_id: categories[0]?.id || 1,
      supplier_id: null,
      brand: '',
      purchase_price: 0,
      selling_price: 0,
      quantity: 10,
      min_threshold: 5,
      description: '',
    },
  });

  const watchPurchasePrice = watch('purchase_price') || 0;
  const watchSellingPrice = watch('selling_price') || 0;

  const profitPerUnit = Math.max(0, watchSellingPrice - watchPurchasePrice);
  const profitMargin = watchSellingPrice > 0 ? ((profitPerUnit / watchSellingPrice) * 100).toFixed(1) : '0';

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        category_id: product.category_id,
        supplier_id: product.supplier_id || null,
        brand: product.brand || '',
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        min_threshold: product.min_threshold,
        description: product.description || '',
      });
      setImagePreview(product.image_url || null);
    } else {
      reset({
        name: '',
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        barcode: '',
        category_id: categories[0]?.id || 1,
        supplier_id: null,
        brand: '',
        purchase_price: 0,
        selling_price: 0,
        quantity: 10,
        min_threshold: 5,
        description: '',
      });
      setImagePreview(null);
    }
    setErrorMsg(null);
  }, [product, isOpen, reset, categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg(null);
      const res = await productsApi.uploadImage(file);
      setImagePreview(res.image_url);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        ...data,
        supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
        image_url: imagePreview || undefined,
      };

      if (product) {
        await productsApi.updateProduct(product.id, payload);
      } else {
        await productsApi.createProduct(payload as any);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      subtitle={product ? `Update details for SKU: ${product.sku}` : 'Fill in the information to add a product to stock'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Image Upload Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Image</label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                  <span className="text-[10px] font-medium block">
                    {uploadingImage ? 'Uploading...' : 'No image'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="product-image-upload"
              />
              <label
                htmlFor="product-image-upload"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Supports JPG, PNG, WEBP, or SVG. Maximum file size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Product Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Beats Pro Studio Wireless"
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Code *</label>
            <input
              type="text"
              {...register('sku')}
              placeholder="e.g. BEATS-PRO-BLK"
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
            />
            {errors.sku && <p className="text-rose-500 text-[11px] mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
            <select
              {...register('category_id')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-rose-500 text-[11px] mt-1">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
            <input
              type="text"
              {...register('brand')}
              placeholder="e.g. Apple, Nike, Sony"
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Barcode</label>
            <input
              type="text"
              {...register('barcode')}
              placeholder="e.g. 890123456789"
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
            <select
              {...register('supplier_id')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">No supplier specified</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contact_person || 'Direct'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Profit Calculation Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Pricing & Margin Analysis (INR ₹)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Purchase Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchase_price')}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              {errors.purchase_price && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.purchase_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('selling_price')}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              {errors.selling_price && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.selling_price.message}</p>
              )}
            </div>
          </div>

          {/* Live Profit Preview */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profit / Unit: <strong>{formatINR(profitPerUnit)}</strong></span>
            </div>
            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Margin: {profitMargin}%
            </span>
          </div>
        </div>

        {/* Stock Quantities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Available Stock Units *</label>
            <input
              type="number"
              {...register('quantity')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
            />
            {errors.quantity && <p className="text-rose-500 text-[11px] mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Low-Stock Alert Threshold *</label>
            <input
              type="number"
              {...register('min_threshold')}
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
            />
            {errors.min_threshold && (
              <p className="text-rose-500 text-[11px] mt-1">{errors.min_threshold.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
          <textarea
            rows={2}
            {...register('description')}
            placeholder="Specifications, warranty, packaging details..."
            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Saving Product...' : product ? 'Update Product' : 'Add Product to Inventory'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
