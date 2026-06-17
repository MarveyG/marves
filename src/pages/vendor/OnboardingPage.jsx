import { useState, useRef } from 'react'
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

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function StepTracker({ current, setStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              onClick={() => current > step.id && setStep(step.id)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                ${current > step.id
                  ? 'bg-[#F0EBFF] text-[#6C3FC5] border-2 border-[#6C3FC5] cursor-pointer hover:bg-[#6C3FC5] hover:text-white'
                  : current === step.id
                    ? 'bg-[#6C3FC5] text-white cursor-default'
                    : 'bg-white border-2 border-gray-200 text-gray-400 cursor-default'
                }`}
            >
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
  focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10`

// ── STEP 1 ─────────────────────────────────────────────────
function Step1({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">Set up your store</h2>
        <p className="text-sm text-gray-500">Give your store a name and a unique URL customers can find you at.</p>
      </div>
      <Field label="Store name">
        <input type="text" value={data.name}
          onChange={e => { onChange('name', e.target.value); onChange('slug', slugify(e.target.value)) }}
          placeholder="e.g. Amaka's Closet" className={inputClass} />
      </Field>
      <Field label="Store URL" helper="Only lowercase letters, numbers, and hyphens. Cannot be changed later.">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10">
          <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">marves.com/store/</span>
          <input type="text" value={data.slug} onChange={e => onChange('slug', slugify(e.target.value))}
            placeholder="amakas-closet" className="flex-1 px-3 py-2.5 text-sm outline-none bg-white" />
        </div>
      </Field>
      <Field label="Store description">
        <textarea value={data.description} onChange={e => onChange('description', e.target.value)}
          placeholder="Tell customers what you sell and what makes your store special..."
          rows={3} className={`${inputClass} resize-none`} />
      </Field>
      <Field label="Categories" helper="Select all that apply to your store">
        <div className="border border-gray-200 rounded-lg p-3 focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10 transition-all">
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
            {(data.categories || []).map(cat => (
              <span key={cat} className="flex items-center gap-1 px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] text-xs rounded-full font-medium">
                {cat}
                <button
                  type="button"
                  onClick={() => onChange('categories', data.categories.filter(c => c !== cat))}
                  className="hover:text-red-500 text-[#6C3FC5]/60 leading-none"
                >×</button>
              </span>
            ))}
            {(data.categories || []).length === 0 && (
              <span className="text-xs text-gray-400">No categories selected yet</span>
            )}
          </div>
          <select
            value=""
            onChange={e => {
              const val = e.target.value
              if (!val) return
              const current = data.categories || []
              if (!current.includes(val)) onChange('categories', [...current, val])
            }}
            className="w-full text-sm outline-none bg-transparent text-gray-500 cursor-pointer"
          >
            <option value="">+ Add a category...</option>
            {CATEGORIES.filter(c => !(data.categories || []).includes(c)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Field>
      <Field label="State">
        <select value={data.state} onChange={e => onChange('state', e.target.value)} className={inputClass}>
          <option value="">Select state...</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="WhatsApp number" helper="For order notifications — customers can also chat with you directly.">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10">
          <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">+234</span>
          <input type="tel" value={data.whatsapp} onChange={e => onChange('whatsapp', e.target.value)}
            placeholder="8012345678" className="flex-1 px-3 py-2.5 text-sm outline-none bg-white" />
        </div>
      </Field>
    </div>
  )
}

// ── STEP 2 ─────────────────────────────────────────────────
function Step2({ data, onChange }) {
  const bannerRef = useRef()
  const logoRef = useRef()
  const [bannerPreview, setBannerPreview] = useState(data.bannerPreview || null)
  const [logoPreview, setLogoPreview] = useState(data.logoPreview || null)

  const handleBanner = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Banner must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBannerPreview(ev.target.result)
      onChange('bannerPreview', ev.target.result)
      onChange('bannerFile', file)
    }
    reader.readAsDataURL(file)
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result)
      onChange('logoPreview', ev.target.result)
      onChange('logoFile', file)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">Add your branding</h2>
        <p className="text-sm text-gray-500">Upload a logo and banner to make your store feel like yours.</p>
      </div>
      <div className="bg-[#F0EBFF] rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-[#6C3FC5] text-sm mt-0.5">ℹ</span>
        <p className="text-sm text-[#2D1B5E]">You can skip this and add them later in store settings.</p>
      </div>

      {/* Banner */}
      <Field label="Store banner" optional helper="Recommended: 1200×300px · PNG or JPG · Max 5MB">
        <div onClick={() => bannerRef.current?.click()}
          className="relative border-2 border-dashed border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all"
          style={{ height: '100px' }}>
          {bannerPreview ? (
            <>
              <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium">Click to change</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span className="text-2xl">🖼</span>
              <p className="text-sm text-gray-500"><span className="text-[#6C3FC5] font-medium">Click to upload banner</span></p>
            </div>
          )}
        </div>
        <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBanner} />
      </Field>

      {/* Logo */}
      <Field label="Store logo" optional helper="Square image · PNG or JPG · Min 200×200px · Max 5MB">
        <div className="flex items-center gap-4">
          <div onClick={() => logoRef.current?.click()}
            className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all overflow-hidden flex-shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl">🏪</span>
            }
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Store logo</p>
            <button type="button" onClick={() => logoRef.current?.click()}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#6C3FC5] hover:text-[#6C3FC5] transition-colors">
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </button>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogo} />
      </Field>

      {/* Social */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Instagram" optional>
          <input type="text" value={data.instagram} onChange={e => onChange('instagram', e.target.value)}
            placeholder="@yourhandle" className={inputClass} />
        </Field>
        <Field label="TikTok" optional>
          <input type="text" value={data.tiktok} onChange={e => onChange('tiktok', e.target.value)}
            placeholder="@yourhandle" className={inputClass} />
        </Field>
      </div>
    </div>
  )
}

// ── STEP 3 ─────────────────────────────────────────────────
function Step3() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#2D1B5E] mb-1">How payments work</h2>
        <p className="text-sm text-gray-500">Here's how you'll get paid when customers order from your store.</p>
      </div>

      {/* Commission explainer */}
      <div className="bg-[#F0EBFF] rounded-lg px-4 py-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">🛡</span>
        <div>
          <p className="text-sm font-semibold text-[#2D1B5E] mb-1">Secure payments via Paystack</p>
          <p className="text-sm text-[#2D1B5E]/80 leading-relaxed">
            Customers pay through Paystack — Nigeria's most trusted payment platform. Cards, bank transfers, USSD, and mobile money all supported.
          </p>
        </div>
      </div>

      {/* How commission works */}
      <div className="border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-[#1A1A2E] mb-4">How Marves commission works</p>
        <div className="space-y-3 mb-4">
          {[
            { icon: '🛒', text: 'Customer places an order and pays through your store' },
            { icon: '⚡', text: 'Payment is processed instantly and securely by Paystack' },
            { icon: '✂️', text: 'Marves automatically deducts a 7% platform commission' },
            { icon: '💰', text: 'The remaining 93% is transferred to your account' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-base">{item.icon}</span>
              <p className="text-sm text-gray-600 leading-snug">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Earnings preview */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example earnings</p>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Product price</span><span className="font-medium">₦10,000</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Marves commission (7%)</span><span className="font-medium text-red-500">−₦700</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="font-semibold text-gray-700">You receive</span>
            <span className="font-bold text-green-600">₦9,300</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">ℹ</span>
        <p className="text-sm text-amber-800">
          You'll connect your Paystack account and bank details in your <strong>dashboard settings</strong> after your store is live.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Don't have a Paystack account?{' '}
        <a href="https://paystack.com" target="_blank" rel="noreferrer" className="text-[#6C3FC5] hover:underline font-medium">Create one free →</a>
      </p>
    </div>
  )
}

// ── STEP 4 ─────────────────────────────────────────────────
function Step4({ storeSlug }) {
  const navigate = useNavigate()
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[#F0EBFF] flex items-center justify-center mx-auto mb-5">
        <span className="text-3xl">🎉</span>
      </div>
      <p className="text-xs font-semibold text-[#6C3FC5] uppercase tracking-widest mb-2">Store live</p>
      <h2 className="text-2xl font-semibold text-[#2D1B5E] mb-3">Your store is ready!</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
        Share your link on Instagram, WhatsApp, or TikTok and start getting orders.
      </p>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-6 max-w-sm mx-auto">
        <span className="text-sm text-gray-600 flex-1 text-left truncate">
          marves-store.vercel.app/store/<strong>{storeSlug}</strong>
        </span>
        <button onClick={() => { navigator.clipboard.writeText(`marves-store.vercel.app/store/${storeSlug}`); toast.success('Link copied!') }}
          className="text-xs text-[#6C3FC5] border border-[#6C3FC5] rounded-full px-3 py-1 hover:bg-[#F0EBFF] transition-colors whitespace-nowrap">
          Copy link
        </button>
      </div>
      <div className="space-y-3 max-w-xs mx-auto">
        <button onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors">
          Go to dashboard →
        </button>
        <button onClick={() => navigate('/dashboard/products/new')}
          className="w-full py-2.5 border border-[#6C3FC5] text-[#6C3FC5] text-sm font-medium rounded-lg hover:bg-[#F0EBFF] transition-colors">
          Add your first product
        </button>
      </div>
    </div>
  )
}

// ── MAIN ───────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [storeData, setStoreData] = useState({
    name: '', slug: '', description: '',
    categories: [], state: '', whatsapp: '',
    instagram: '', tiktok: '',
    bannerFile: null, bannerPreview: null,
    logoFile: null, logoPreview: null,
    bankName: '', accountNumber: '', accountName: '',
  })

  const onChange = (key, value) => setStoreData(prev => ({ ...prev, [key]: value }))

  const validateStep = () => {
    if (step === 1) {
      if (!storeData.name) { toast.error('Store name is required'); return false }
      if (!storeData.slug) { toast.error('Store URL is required'); return false }
      if (!storeData.categories.length) { toast.error('Please select at least one category'); return false }
      if (!storeData.state) { toast.error('Please select your state'); return false }
    }
    if (step === 3) {
      if (!storeData.bankName) { toast.error('Please select your bank'); return false }
      if (!storeData.accountNumber || storeData.accountNumber.length < 10) { toast.error('Please enter a valid 10-digit account number'); return false }
      if (!storeData.accountName.trim()) { toast.error('Please enter your account name'); return false }
    }
    return true
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file, bucket, path) => {
    const ext = file.name.split('.').pop()
    const filePath = `${path}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return publicUrl
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step === 3) {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        // Upload banner and logo if provided
        let bannerUrl = null
        let logoUrl = null

        if (storeData.bannerFile) {
          bannerUrl = await uploadImage(storeData.bannerFile, 'store-assets', `${user.id}/banner`)
        }
        if (storeData.logoFile) {
          logoUrl = await uploadImage(storeData.logoFile, 'store-assets', `${user.id}/logo`)
        }

        // Create store
        const { error } = await supabase.from('stores').insert({
          vendor_id: user.id,
          name: storeData.name,
          slug: storeData.slug,
          description: storeData.description,
          category: storeData.categories[0] || null,
          categories: storeData.categories,
          city: storeData.state,
          whatsapp: storeData.whatsapp ? `+234${storeData.whatsapp}` : null,
          instagram: storeData.instagram,
          tiktok: storeData.tiktok,
          banner_url: bannerUrl,
          logo_url: logoUrl,
          bank_name: storeData.bankName,
          account_number: storeData.accountNumber,
          account_name: storeData.accountName,
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
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></span>
      </div>
      <StepTracker current={step} setStep={setStep} />
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {step === 1 && <Step1 data={storeData} onChange={onChange} />}
        {step === 2 && <Step2 data={storeData} onChange={onChange} />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 storeSlug={storeData.slug} />}
        {step < 4 && (
          <div className={`flex items-center mt-8 pt-6 border-t border-gray-100 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                ← Back
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              className="px-6 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {step === 3 ? 'Launch my store →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">© 2026 Marves · Made with love in Nigeria 🇳🇬</p>
    </div>
  )
}
