import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Store, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    setIsLoading(true)
    try {
      await login(data.username, data.password)
      navigate('/')
    } catch (err: any) {
      if (err.response?.status === 401) {
        setServerError('Invalid username or password. Please try again.')
      } else if (err.response?.data?.detail) {
        setServerError(err.response.data.detail)
      } else {
        setServerError('Cannot connect to backend server. Make sure the backend is running on port 8000.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Branding Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0F172A] p-12 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-800/10" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-black/90 border border-amber-500/40 p-1 flex items-center justify-center shadow-xl">
            <img src="/logo.png" alt="House of DNA" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-2xl tracking-wide">House of DNA</p>
            <p className="text-amber-300/80 text-xs italic font-serif">Style runs in your DNA.</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              House of <span className="text-amber-400">DNA</span>
            </h1>
            <p className="mt-2 text-amber-300/90 text-sm font-serif italic">
              Style runs in your DNA.
            </p>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Premium Retail & Fashion Management System — complete inventory, POS sales, profits, and analytics.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              'Real-time inventory tracking',
              'Sales POS with instant profit calculation',
              'Revenue & expense analytics',
              'Low stock alerts & reports',
            ].map((feat, i) => (
              <motion.div
                key={feat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
                <span className="text-slate-300 text-sm">{feat}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-2 text-slate-500 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured with JWT authentication</span>
        </div>
      </motion.div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-black/90 border border-amber-500/30 p-1 flex items-center justify-center">
              <img src="/logo.png" alt="House of DNA" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">House of DNA</p>
              <p className="text-xs text-amber-700 italic font-serif">Style runs in your DNA.</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your store dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className={`w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none transition-all
                  ${errors.username
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm bg-white outline-none transition-all
                    ${errors.password
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">Default credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-blue-600">Username: <span className="font-mono font-bold">admin</span></p>
              <p className="text-xs text-blue-600">Password: <span className="font-mono font-bold">admin123</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
