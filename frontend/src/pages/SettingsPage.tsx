import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Settings, Store, Shield, Database, Tag, Truck,
  Plus, Pencil, Trash2, Loader2, CheckCircle, XCircle,
  Eye, EyeOff, User, AlertCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../api/client'

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

const categorySchema = z.object({ name: z.string().min(1, 'Name required'), description: z.string().optional() })
type CategoryForm = z.infer<typeof categorySchema>

const supplierSchema = z.object({
  name: z.string().min(1, 'Name required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
})
type SupplierForm = z.infer<typeof supplierSchema>

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow
        ${type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'suppliers' | 'database'>('profile')
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: any }>({ open: false, editing: null })
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; editing: any }>({ open: false, editing: null })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Password form
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: errPwd } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  // Categories
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data),
  })

  const { register: regCat, handleSubmit: handleCat, reset: resetCat, setValue: setCatVal, formState: { errors: errCat } } =
    useForm<CategoryForm>({ resolver: zodResolver(categorySchema) })

  const addCategory = useMutation({
    mutationFn: (data: CategoryForm) => apiClient.post('/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setCategoryModal({ open: false, editing: null }); resetCat(); showToast('Category saved!', 'success') },
    onError: () => showToast('Failed to save category', 'error'),
  })

  const deleteCategory = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); showToast('Category deleted', 'success') },
    onError: () => showToast('Cannot delete — category is in use', 'error'),
  })

  // Suppliers
  const { data: suppliers = [], isLoading: supLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiClient.get('/suppliers').then(r => r.data),
  })

  const { register: regSup, handleSubmit: handleSup, reset: resetSup, setValue: setSupVal, formState: { errors: errSup } } =
    useForm<SupplierForm>({ resolver: zodResolver(supplierSchema) })

  const saveSupplier = useMutation({
    mutationFn: (data: SupplierForm) =>
      supplierModal.editing ? apiClient.put(`/suppliers/${supplierModal.editing.id}`, data) : apiClient.post('/suppliers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setSupplierModal({ open: false, editing: null }); resetSup(); showToast('Supplier saved!', 'success') },
    onError: () => showToast('Failed to save supplier', 'error'),
  })

  const deleteSupplier = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); showToast('Supplier deleted', 'success') },
    onError: () => showToast('Cannot delete supplier', 'error'),
  })

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) => apiClient.put('/auth/change-password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    }),
    onSuccess: () => { resetPwd(); showToast('Password changed successfully!', 'success') },
    onError: () => showToast('Current password is incorrect', 'error'),
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'database', label: 'Database', icon: Database },
  ]

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-600" /> Settings
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your store configuration</p>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>

      {/* Store Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 flex items-center gap-5 border border-slate-800">
        <div className="w-16 h-16 rounded-xl bg-black/90 border border-amber-500/40 p-1.5 flex items-center justify-center shadow-lg">
          <img src="/logo.png" alt="House of DNA" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-bold text-2xl tracking-wide">House of DNA</p>
          <p className="text-amber-300/80 text-sm font-serif italic">Style runs in your DNA · Store Management System v1.0.0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profile / Password Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Account Info
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Username', value: user?.username || 'admin' },
                { label: 'Role', value: user?.role || 'Admin' },
                { label: 'Full Name', value: user?.full_name || 'Store Administrator' },
                { label: 'Email', value: user?.email || 'admin@smartstore.in' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> Change Password
            </h3>
            <form onSubmit={handlePwd((data) => changePassword.mutate(data))} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Current Password</label>
                <div className="relative">
                  <input {...regPwd('currentPassword')} type={showCurrent ? 'text' : 'password'}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errPwd.currentPassword && <p className="text-xs text-red-500 mt-1">{errPwd.currentPassword.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">New Password</label>
                <div className="relative">
                  <input {...regPwd('newPassword')} type={showNew ? 'text' : 'password'}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errPwd.newPassword && <p className="text-xs text-red-500 mt-1">{errPwd.newPassword.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Confirm New Password</label>
                <input {...regPwd('confirmPassword')} type="password"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                {errPwd.confirmPassword && <p className="text-xs text-red-500 mt-1">{errPwd.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={changePassword.isPending}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" /> Product Categories
            </h3>
            <button onClick={() => { resetCat(); setCategoryModal({ open: true, editing: null }) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {categoryModal.open && (
            <div className="border-b border-slate-100 p-5 bg-blue-50">
              <form onSubmit={handleCat((data) => addCategory.mutate(data))} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Category Name *</label>
                  <input {...regCat('name')} placeholder="e.g. Electronics"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  {errCat.name && <p className="text-xs text-red-500 mt-1">{errCat.name.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                  <input {...regCat('description')} placeholder="Optional description"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <button type="submit" disabled={addCategory.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2">
                  {addCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save
                </button>
                <button type="button" onClick={() => setCategoryModal({ open: false, editing: null })}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </form>
            </div>
          )}

          {catLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No categories yet. Add your first one above.</p>
                </div>
              )}
              {categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                    {cat.description && <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>}
                  </div>
                  <button onClick={() => deleteCategory.mutate(cat.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> Suppliers
            </h3>
            <button onClick={() => { resetSup(); setSupplierModal({ open: true, editing: null }) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>

          {supplierModal.open && (
            <div className="border-b border-slate-100 p-5 bg-blue-50">
              <form onSubmit={handleSup((data) => saveSupplier.mutate(data))} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Supplier Name *</label>
                  <input {...regSup('name')} placeholder="Company name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  {errSup.name && <p className="text-xs text-red-500 mt-1">{errSup.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Contact Person</label>
                  <input {...regSup('contact_person')} placeholder="Name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Phone</label>
                  <input {...regSup('phone')} placeholder="+91 9000000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                  <input {...regSup('email')} type="email" placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                  <input {...regSup('address')} placeholder="City, State"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={saveSupplier.isPending}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {saveSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save
                  </button>
                  <button type="button" onClick={() => setSupplierModal({ open: false, editing: null })}
                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {supLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              {suppliers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No suppliers yet. Add your first one above.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Contact</th>
                      <th className="text-left px-5 py-3">Phone</th>
                      <th className="text-left px-5 py-3">Email</th>
                      <th className="text-right px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-5 py-3 text-slate-500">{s.contact_person || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{s.phone || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{s.email || '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => deleteSupplier.mutate(s.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Database Info Tab */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" /> Database Information
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Database Type', value: 'SQLite (MySQL fallback available)' },
              { label: 'Database File', value: 'smart_store.db' },
              { label: 'ORM', value: 'SQLAlchemy 2.0' },
              { label: 'Backend', value: 'FastAPI + Python 3.11' },
              { label: 'Authentication', value: 'JWT Bearer Token (HS256)' },
              { label: 'Image Storage', value: 'Local — /uploads/products/' },
              { label: 'Currency', value: 'Indian Rupee (₹) — INR format' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Switch to MySQL for Production</p>
              <p className="text-xs text-amber-600 mt-1">
                Set <code className="font-mono bg-amber-100 px-1 rounded">USE_SQLITE_FALLBACK=false</code> and configure
                <code className="font-mono bg-amber-100 px-1 rounded ml-1">DATABASE_URL</code> in your backend <code className="font-mono bg-amber-100 px-1 rounded">.env</code> file.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
