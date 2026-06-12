import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function PasswordInput({ name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg outline-none transition-all
          focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountType, setAccountType] = useState('vendor')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (accountType === 'vendor' && data.user) {
      await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', data.user.id)
    }

    toast.success('Account created!')

    if (accountType === 'vendor') navigate('/onboarding')
    else navigate('/')

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">

      <div className="text-center mb-8">
        <Link to="/">
          <span className="text-2xl font-semibold text-[#2D1B5E]">
            Mar<span className="text-[#6C3FC5]">ves</span>
          </span>
        </Link>
        <p className="text-sm text-gray-500 mt-2">Create your free account</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

        <h1 className="text-xl font-semibold text-[#2D1B5E] mb-2">Get started free</h1>
        <p className="text-sm text-gray-500 mb-6">
          Join thousands of vendors already selling on Marves
        </p>

        {/* Account type toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setAccountType('vendor')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${
              accountType === 'vendor'
                ? 'bg-[#6C3FC5] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            I want to sell
          </button>
          <button
            type="button"
            onClick={() => setAccountType('customer')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${
              accountType === 'customer'
                ? 'bg-[#6C3FC5] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            I want to shop
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Amaka Okafor"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
                focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="amaka@example.com"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
                focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
            />
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            By creating an account you agree to Marves'{' '}
            <span className="text-[#6C3FC5] cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-[#6C3FC5] cursor-pointer hover:underline">Privacy Policy</span>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60
              text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : accountType === 'vendor' ? 'Create my store' : 'Create account'}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6C3FC5] font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        © 2026 Marves · Made with love in Nigeria 🇳🇬
      </p>
    </div>
  )
}
