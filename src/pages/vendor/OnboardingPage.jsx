import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Store basics' },
  { id: 2, label: 'Branding' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Go live' },
]

const CATEGORIES = [
  'Fashion & Clothing', 'Beauty & Personal Care', 'Food & Drinks',
  'Electronics & Gadgets', 'Home & Living', 'Health & Wellness',
  'Digital Products', 'Art & Crafts', 'Books & Stationery',
  'Agriculture & Farm', 'Automotive', 'Services', 'Other'
]

const CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Kano',
  'Ibadan', 'Enugu', 'Benin City', 'Kaduna', 'Other'
]

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ── STEP TRACKER ──────────────────────────────────────────
function StepTracker({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
              ${current > step.id
                ? 'bg-[#F0EBFF] text-[#6C3FC5] border-2 border-[#6C3FC5]'
                : current === step.id
                  ? 'bg-[#6C3FC5] text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
              {current > step.id ? '✓' : step.id}
            </div>
            <span className={`text-xs mt-1 font-medium hidden sm:block
              ${current >= step.id ? 'text-[#6C3FC5]' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-px mx-1 mb-4 transition-all
              ${current > step.id ? 'bg-[#6C3FC5]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── FIELD COMPONENT ────────────────────────────────────────
function Field({ label, optional, helper, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="font-normal text-gray-400 ml-1">(optional)</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  )
}

const inputClass = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
  focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10 bg-white`

// ── STEP 1: STORE BASICS ───────────────────────────────────
function Step1({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">Set up your store</h2>
        <p className="text-sm text-gray-500">Give your store a name and a unique URL customers can find you at.</p>
      </div>

      <Field label="Store name">
        <input
          type="text"
          value={data.name}
          onChange={e => {
            onChange('name', e.target.value)
            onChange('slug', slugify(e.target.value))
          }}
          placeholder="e.g. Amaka's Closet"
          className={inputClass}
        />
      </Field>

      <Field
        label="Store URL"
        helper="Only lowercase letters, numbers, and hyphens. Cannot be changed later."
      >
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10">
          <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
            marves.com/store/
          </span>
          <input
            type="text"
            value={data.slug}
            onChange={e => onChange('slug', slugify(e.target.value))}
            placeholder="amakas-closet"
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
          />
        </div>
      </Field>

      <Field label="Store description">
        <textarea
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Tell customers what you sell and what makes your store special..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select
            value={data.category}
            onChange={e => onChange('category', e.target.value)}
            className={inputClass}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="City">
          <select
            value={data.city}
            onChange={e => onChange('city', e.target.value)}
            className={inputClass}
          >
            <option value="">Select city...</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="WhatsApp number" helper="For order notifications — customers can also chat with you directly.">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10">
          <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">+234</span>
          <input
            type="tel"
            value={data.whatsapp}
            onChange={e => onChange('whatsapp', e.target.value)}
            placeholder="8012345678"
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
          />
        </div>
      </Field>
    </div>
  )
}

// ── STEP 2: BRANDING ───────────────────────────────────────
function Step2({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">Add your branding</h2>
        <p className="text-sm text-gray-500">Upload a logo and banner to make your store feel like yours.</p>
      </div>

      <div className="bg-[#F0EBFF] rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-[#6C3FC5] text-sm mt-0.5">ℹ</span>
        <p className="text-sm text-[#2D1B5E]">
          Your logo and banner make your store look professional. Customers trust stores with complete branding.
        </p>
      </div>

      <Field label="Store banner" helper="Recommended: 1200×300px · PNG or JPG">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all cursor-pointer">
          <div className="text-3xl mb-2">🖼</div>
          <p className="text-sm text-gray-500">
            <span className="text-[#6C3FC5] font-medium">Click to upload banner</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG or JPG up to 5MB</p>
        </div>
      </Field>

      <Field label="Store logo" helper="Square image · PNG or JPG · Min 200×200px">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all cursor-pointer">
          <div className="text-3xl mb-2">🏪</div>
          <p className="text-sm text-gray-500">
            <span className="text-[#6C3FC5] font-medium">Click to upload logo</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG or JPG up to 2MB</p>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Instagram" optional>
          <input
            type="text"
            value={data.instagram}
            onChange={e => onChange('instagram', e.target.value)}
            placeholder="@yourhandle"
            className={inputClass}
          />
        </Field>
        <Field label="TikTok" optional>
          <input
            type="text"
            value={data.tiktok}
            onChange={e => onChange('tiktok', e.target.value)}
            placeholder="@yourhandle"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  )
}

// ── STEP 3: PAYMENT ────────────────────────────────────────
function Step3({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">Payment setup</h2>
        <p className="text-sm text-gray-500">Connect your Paystack account to start receiving payments.</p>
      </div>

      <div className="bg-[#F0EBFF] rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-[#6C3FC5] text-sm mt-0.5">🛡</span>
        <p className="text-sm text-[#2D1B5E]">
          Marves uses Paystack to process payments securely. A <strong>7% commission</strong> is automatically
          deducted per sale — you only pay when you earn.
        </p>
      </div>

      <Field
        label="Paystack Secret Key"
        helper="Find this in your Paystack dashboard → Settings → API Keys. Use your live key for real payments."
      >
        <input
          type="password"
          value={data.paystackKey}
          onChange={e => onChange('paystackKey', e.target.value)}
          placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
          className={inputClass}
        />
      </Field>

      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Earnings preview</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Product price</span>
            <span className="font-medium">₦10,000</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Marves commission (7%)</span>
            <span className="font-medium text-red-500">−₦700</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">You receive</span>
            <span className="font-semibold text-green-600">₦9,300</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Don't have a Paystack account?{' '}
        <a href="https://paystack.com" target="_blank" rel="noreferrer"
          className="text-[#6C3FC5] hover:underline font-medium">
          Create one free →
        </a>
      </p>
    </div>
  )
}

// ── STEP 4: SUCCESS ────────────────────────────────────────
function Step4({ storeName, storeSlug }) {
  const navigate = useNavigate()
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[#F0EBFF] flex items-center justify-center mx-auto mb-5">
        <span className="text-3xl">🎉</span>
      </div>
      <p className="text-xs font-semibold text-[#6C3FC5] uppercase tracking-widest mb-2">Store live</p>
      <h2 className="text-2xl font-semibold text-[#2D1B5E] mb-3">Your store is ready!</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
        Marves has set up your storefront. Share your link on Instagram, WhatsApp,
        or TikTok and start getting orders.
      </p>

      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-6 max-w-sm mx-auto">
        <span className="text-sm text-gray-600 flex-1 text-left truncate">
          marves.com/store/<strong>{storeSlug}</strong>
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`marves.com/store/${storeSlug}`)
            toast.success('Link copied!')
          }}
          className="text-xs text-[#6C3FC5] border border-[#6C3FC5] rounded-full px-3 py-1 hover:bg-[#F0EBFF] transition-colors whitespace-nowrap"
        >
          Copy link
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="text-green-500">📱</span> WhatsApp alerts on
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#6C3FC5]">✉️</span> Email alerts on
        </span>
      </div>

      <div className="space-y-3 max-w-xs mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Go to dashboard →
        </button>
        <button
          onClick={() => navigate('/dashboard/products/new')}
          className="w-full py-2.5 border border-[#6C3FC5] text-[#6C3FC5] text-sm font-medium rounded-lg hover:bg-[#F0EBFF] transition-colors"
        >
          Add your first product
        </button>
      </div>
    </div>
  )
}

// ── MAIN ONBOARDING PAGE ───────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [storeData, setStoreData] = useState({
    name: '', slug: '', description: '',
    category: '', city: '', whatsapp: '',
    instagram: '', tiktok: '',
    paystackKey: '',
  })

  const onChange = (key, value) => {
    setStoreData(prev => ({ ...prev, [key]: value }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!storeData.name) { toast.error('Store name is required'); return false }
      if (!storeData.slug) { toast.error('Store URL is required'); return false }
      if (!storeData.category) { toast.error('Please select a category'); return false }
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step === 3) {
      // Create the store in Supabase
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { error } = await supabase.from('stores').insert({
          vendor_id: user.id,
          name: storeData.name,
          slug: storeData.slug,
          description: storeData.description,
          category: storeData.category,
          city: storeData.city,
          whatsapp: storeData.whatsapp ? `+234${storeData.whatsapp}` : null,
          instagram: storeData.instagram,
          tiktok: storeData.tiktok,
          status: 'active',
        })

        if (error) {
          if (error.code === '23505') {
            toast.error('That store URL is already taken. Please choose another.')
          } else {
            toast.error(error.message)
          }
          setLoading(false)
          return
        }

        toast.success('Store created!')
        setStep(4)
      } catch (err) {
        toast.error('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">

      {/* Logo */}
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-[#2D1B5E]">
          Mar<span className="text-[#6C3FC5]">ves</span>
        </span>
      </div>

      {/* Step tracker */}
      <StepTracker current={step} />

      {/* Card */}
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

        {step === 1 && <Step1 data={storeData} onChange={onChange} />}
        {step === 2 && <Step2 data={storeData} onChange={onChange} />}
        {step === 3 && <Step3 data={storeData} onChange={onChange} />}
        {step === 4 && <Step4 storeName={storeData.name} storeSlug={storeData.slug} />}

        {step < 4 && (
          <div className={`flex items-center mt-8 pt-6 border-t border-gray-100
            ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60
                text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your store...
                </>
              ) : step === 3 ? 'Launch my store →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        © 2026 Marves · Made with love in Nigeria 🇳🇬
      </p>
    </div>
  )
}
