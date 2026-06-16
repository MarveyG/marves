import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Fashion & Clothing', 'Beauty & Personal Care', 'Food & Drinks',
  'Electronics & Gadgets', 'Home & Living', 'Health & Wellness',
  'Digital Products', 'Art & Crafts', 'Books & Stationery',
  'Agriculture & Farm', 'Automotive', 'Services', 'Other'
]

const PLATFORM_FEE_RATE = 0.035 // 3.5% service fee added to customer, vendor keeps full price

function Field({ label, optional, helper, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="font-normal text-gray-400 ml-1">(optional)</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none
  transition-all focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10 bg-white`

export default function AddProductPage() {
  const navigate = useNavigate()
  const imgInputRef = useRef()
  const fileInputRef = useRef()

  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    product_type: 'physical',
    price: '',
    compare_at_price: '',
    stock_quantity: '',
    unlimited_stock: false,
    sku: '',
    weight: '',
    delivery_days: '2-4 days',
    tags: [],
    status: 'active',
    featured: false,
    digital_file_url: '',
    download_limit: null,
  })

  useEffect(() => {
    const loadStore = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase
        .from('stores').select('*').eq('vendor_id', user.id).single()
      if (!data) { navigate('/onboarding'); return }
      setStore(data)
    }
    loadStore()
  }, [])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  // Commission preview
  const price = parseFloat(form.price) || 0
  const serviceFee = Math.round(price * PLATFORM_FEE_RATE)
  const customerPays = price + serviceFee

  // Image handling
  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (imagePreviews.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreviews(p => [...p, ev.target.result])
        setImageFiles(f => [...f, file])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx) => {
    setImagePreviews(p => p.filter((_, i) => i !== idx))
    setImageFiles(f => f.filter((_, i) => i !== idx))
  }

  // Tag handling
  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!form.tags.includes(tagInput.trim())) {
        set('tags', [...form.tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    set('tags', form.tags.filter(t => t !== tag))
  }

  // Validate
  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Valid price is required'
    if (!form.category) errs.category = 'Category is required'
    if (imageFiles.length === 0) errs.images = 'At least one product image is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Upload images to Supabase Storage
  const uploadImages = async (storeId) => {
    const urls = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error(`Image upload failed: ${error.message}`)
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  // Submit
  const handleSubmit = async (status = 'active') => {
    if (!validate()) { toast.error('Please fix the errors above'); return }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Upload images
      let imageUrls = []
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(store.id)
      }

      const productData = {
        store_id: store.id,
        vendor_id: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        product_type: form.product_type,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock_quantity: form.unlimited_stock ? 0 : parseInt(form.stock_quantity) || 0,
        unlimited_stock: form.unlimited_stock,
        sku: form.sku || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        delivery_days: form.product_type === 'physical' ? form.delivery_days : null,
        tags: form.tags,
        images: imageUrls,
        status,
        featured: form.featured,
        download_limit: form.product_type === 'digital' ? form.download_limit : null,
      }

      const { error } = await supabase.from('products').insert(productData)
      if (error) throw new Error(error.message)

      toast.success(status === 'active' ? 'Product published!' : 'Saved as draft')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 h-12 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Products
          </Link>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-[#1A1A2E]">Add new product</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-300 transition-colors"
          >
            Save as draft
          </button>
          <button
            onClick={() => handleSubmit('active')}
            disabled={loading}
            className="px-4 py-1.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Publish product
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        <div className="grid grid-cols-[1fr_280px] gap-4 max-w-5xl mx-auto">

          {/* LEFT */}
          <div className="space-y-4">

            {/* Product type */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">Product type</p>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-3">
                {['physical', 'digital'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('product_type', type)}
                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-all
                      ${form.product_type === type ? 'bg-[#6C3FC5] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    {type === 'physical' ? '📦 Physical product' : '📄 Digital product'}
                  </button>
                ))}
              </div>
              <div className="bg-[#F0EBFF] rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-[#6C3FC5] text-xs mt-0.5">ℹ</span>
                <p className="text-xs text-[#2D1B5E]">
                  {form.product_type === 'physical'
                    ? 'Physical products are shipped to the customer. Set stock quantity and delivery options below.'
                    : 'Digital products are delivered instantly via download link after payment.'}
                </p>
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-[#1A1A2E]">Basic information</p>
              <Field label="Product name" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Ankara wrap dress"
                  className={`${inputCls} ${errors.name ? 'border-red-300 focus:border-red-400' : ''}`}
                />
              </Field>
              <Field label="Description" optional>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe your product — material, size options, what makes it special..."
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Field label="Category" error={errors.category}>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className={`${inputCls} ${errors.category ? 'border-red-300' : ''}`}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Tags" optional helper="Press Enter after each tag">
                <div
                  className="flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 border border-gray-200 rounded-lg cursor-text focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10"
                  onClick={() => document.getElementById('tag-input').focus()}
                >
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] text-xs rounded-full font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 text-[#6C3FC5]/60">×</button>
                    </span>
                  ))}
                  <input
                    id="tag-input"
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={form.tags.length === 0 ? 'Add tags...' : ''}
                    className="border-none outline-none text-sm bg-transparent flex-1 min-w-[80px]"
                  />
                </div>
              </Field>
            </div>

            {/* Pricing */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-[#1A1A2E]">Pricing</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price" error={errors.price}>
                  <div className={`flex items-center border rounded-lg overflow-hidden transition-all focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10 ${errors.price ? 'border-red-300' : 'border-gray-200'}`}>
                    <span className="px-3 py-2.5 text-sm font-medium text-gray-400 bg-gray-50 border-r border-gray-200">₦</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </Field>
                <Field label="Compare-at price" optional helper="Shows as strikethrough original price">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10">
                    <span className="px-3 py-2.5 text-sm font-medium text-gray-400 bg-gray-50 border-r border-gray-200">₦</span>
                    <input
                      type="number"
                      value={form.compare_at_price}
                      onChange={e => set('compare_at_price', e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Physical: inventory & shipping */}
            {form.product_type === 'physical' && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <p className="text-sm font-medium text-[#1A1A2E]">Inventory & shipping</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stock quantity">
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={e => set('stock_quantity', e.target.value)}
                      disabled={form.unlimited_stock}
                      placeholder="0"
                      className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
                    />
                  </Field>
                  <Field label="SKU" optional>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={e => set('sku', e.target.value)}
                      placeholder="e.g. AWD-001"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set('unlimited_stock', !form.unlimited_stock)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${form.unlimited_stock ? 'bg-[#6C3FC5]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.unlimited_stock ? 'left-[18px]' : 'left-[3px]'}`} />
                  </div>
                  <span className="text-sm text-gray-600">Unlimited stock</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Weight (kg)" optional>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={e => set('weight', e.target.value)}
                      placeholder="0.0"
                      step="0.1"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Delivery estimate">
                    <select value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} className={inputCls}>
                      <option>1-2 days</option>
                      <option>2-4 days</option>
                      <option>3-5 days</option>
                      <option>5-7 days</option>
                      <option>7-14 days</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Digital: file info */}
            {form.product_type === 'digital' && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <p className="text-sm font-medium text-[#1A1A2E]">Digital product settings</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-2">📎</div>
                  <p className="text-sm text-gray-500">
                    <span className="text-[#6C3FC5] font-medium">Click to upload your file</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, ZIP, MP4, MP3, DOCX — max 500MB</p>
                  <input ref={fileInputRef} type="file" className="hidden" />
                </div>
                <Field label="Download limit" optional>
                  <select value={form.download_limit || ''} onChange={e => set('download_limit', e.target.value || null)} className={inputCls}>
                    <option value="">Unlimited downloads</option>
                    <option value="1">1 download per purchase</option>
                    <option value="3">3 downloads per purchase</option>
                    <option value="5">5 downloads per purchase</option>
                  </select>
                </Field>
              </div>
            )}

          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            {/* Images */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">Product images</p>
              {errors.images && <p className="text-xs text-red-500 mb-2">{errors.images}</p>}

              {/* Main slot */}
              <div
                onClick={() => imgInputRef.current?.click()}
                className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-2
                  ${imagePreviews[0] ? 'border-transparent p-0 overflow-hidden' : 'border-gray-200 hover:border-[#6C3FC5] hover:bg-[#F0EBFF]'}`}
              >
                {imagePreviews[0] ? (
                  <div className="relative w-full h-full group">
                    <img src={imagePreviews[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="text-white text-xs">Change photo</span>
                    </div>
                    <span className="absolute top-2 left-2 bg-[#6C3FC5] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">Main</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeImage(0) }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 text-xs"
                    >×</button>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">🖼</div>
                    <p className="text-xs text-gray-400 text-center">Click to upload<br/>main photo</p>
                  </>
                )}
              </div>

              {/* Additional slots */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    onClick={() => imgInputRef.current?.click()}
                    className={`aspect-square border border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm
                      ${imagePreviews[i] ? 'border-transparent overflow-hidden p-0' : 'border-gray-200 hover:border-[#6C3FC5] hover:bg-[#F0EBFF] text-gray-300'}`}
                  >
                    {imagePreviews[i] ? (
                      <div className="relative w-full h-full group">
                        <img src={imagePreviews[i]} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeImage(i) }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100"
                        >×</button>
                      </div>
                    ) : '+'}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 mt-2">Upload up to 5 images. First image is the main display photo.</p>
              <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </div>

            {/* Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">Status</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'active', label: 'Active', sub: 'Visible to customers' },
                  { val: 'draft',  label: 'Draft',  sub: 'Hidden from store' },
                ].map(s => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => set('status', s.val)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      form.status === s.val
                        ? s.val === 'active'
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-xs font-medium ${form.status === s.val && s.val === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Earnings preview */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">Earnings preview</p>
              <div className="bg-[#F0EBFF] rounded-lg px-3 py-2 mb-3 flex items-start gap-1.5">
                <span className="text-[#6C3FC5] text-xs">ℹ</span>
                <p className="text-xs text-[#2D1B5E]">Marves adds a 3.5% service fee on top — paid by the customer, not you.</p>
              </div>
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Your listed price</span>
                  <span className="font-medium">₦{price > 0 ? price.toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Service fee (3.5%, paid by customer)</span>
                  <span className="font-medium text-[#6C3FC5]">+₦{price > 0 ? serviceFee.toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Customer pays</span>
                  <span className="font-medium">₦{price > 0 ? customerPays.toLocaleString() : '0'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
                  <span className="font-medium text-gray-700">You receive</span>
                  <span className={`font-semibold ${price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    ₦{price > 0 ? price.toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">Visibility</p>
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-gray-700">Featured product</p>
                  <p className="text-[10px] text-gray-400">Pin to top of your storefront</p>
                </div>
                <div
                  onClick={() => set('featured', !form.featured)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.featured ? 'bg-[#6C3FC5]' : 'bg-gray-200'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.featured ? 'left-[18px]' : 'left-[3px]'}`} />
                </div>
              </label>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
