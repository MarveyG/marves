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

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    toast.success('Welcome back!')

    if (profile?.role === 'admin') navigate('/admin')
    else if (profile?.role === 'vendor') navigate('/dashboard')
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
        <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

        <h1 className="text-xl font-semibold text-[#2D1B5E] mb-6">Welcome back</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
                focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <span className="text-xs text-[#6C3FC5] cursor-pointer hover:underline">Forgot password?</span>
            </div>
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60
              text-white text-sm font-medium rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#6C3FC5] font-medium hover:underline">
            Create one free
          </Link>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">or</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Want to sell on Marves?{' '}
          <Link to="/register" className="text-[#6C3FC5] font-medium hover:underline">
            Open your free store
          </Link>
        </p>

      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        © 2026 Marves · Made with love in Nigeria 🇳🇬
      </p>
    </div>
  )
}
