import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

const STEPS = ['Cart', 'Delivery', 'Payment']

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const PLATFORM_FEE_RATE = 0.035

function StepTracker({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4 border-b border-gray-100">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all
              ${i < current ? 'bg-[#F0EBFF] text-[#6C3FC5] border-2 border-[#6C3FC5]'
              : i === current ? 'bg-[#6C3FC5] text-white'
              : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-[#6C3FC5]' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-10 sm:w-16 h-px mx-2 ${i < current ? 'bg-[#6C3FC5]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

console.log('Paystack key:', import.meta.env.VITE_PAYSTACK_PUBLIC_KEY)

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: 'Lagos',
    note: '',
  })

  // Wait for cart store to hydrate from localStorage before checking if empty
  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const serviceFee = Math.round(subtotal * PLATFORM_FEE_RATE)
  const deliveryFee = items.some(i => i.product_type === 'physical') ? 1500 : 0
  const total = subtotal + serviceFee + deliveryFee

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10 bg-white"

  const validateDelivery = () => {
    if (!form.fullName.trim()) { toast.error('Full name is required'); return false }
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return false }
    if (items.some(i => i.product_type === 'physical') && !form.address.trim()) {
      toast.error('Delivery address is required'); return false
    }
    if (items.some(i => i.product_type === 'physical') && !form.state) {
      toast.error('Please select your state'); return false
    }
    return true
  }

  const handlePaystack = async () => {
    if (!validateDelivery()) return
    setLoading(true)

    try {
      const orderRef = `MV-${Date.now().toString().slice(-6)}`
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_ref: orderRef,
          customer_name: form.fullName,
          customer_email: form.email,
          customer_phone: form.phone,
          delivery_address: form.address,
          delivery_city: form.city,
          delivery_state: form.state,
          delivery_note: form.note,
          subtotal,
          service_fee: serviceFee,
          delivery_fee: deliveryFee,
          total,
          payment_method: 'paystack',
          payment_status: 'pending',
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw new Error(orderError.message)

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        store_id: item.store_id,
        vendor_id: item.store_id,
        product_name: item.name,
        product_image: item.image,
        product_type: item.product_type,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        commission_rate: 3.5,
        commission_amount: Math.round(item.price * item.quantity * 0.035),
        vendor_payout: item.price * item.quantity,
        status: 'pending',
      }))

      await supabase.from('order_items').insert(orderItems)

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: total * 100,
        ref: orderRef,
        metadata: { order_id: order.id, customer_name: form.fullName },
        onSuccess: async (response) => {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid', payment_reference: response.reference, status: 'confirmed' })
            .eq('id', order.id)

          await supabase
            .from('order_items')
            .update({ status: 'confirmed' })
            .eq('order_id', order.id)

          clearCart()
          navigate(`/order/${orderRef}`)
        },
        onCancel: () => {
          toast.error('Payment cancelled')
          setLoading(false)
        },
      })
      handler.openIframe()
    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('network')) {
        toast.error('Connection error — please check your internet and try again.')
      } else {
        toast.error(err.message)
      }
      setLoading(false)
    }
  }

  // Show loading while cart hydrates from localStorage
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Your cart is empty</p>
        <Link to="/" className="px-4 py-2 bg-[#6C3FC5] text-white text-sm rounded-lg hover:bg-[#5A31A8]">
          Continue shopping
        </Link>
      </div>
    )
  }

  const OrderSummary = ({ showButton = false }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-[#1A1A2E] mb-4">Order summary</p>
      <div className="space-y-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
              {item.image
                ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sm">{item.product_type === 'digital' ? '📄' : '📦'}</div>
              }
            </div>
            <span className="flex-1 text-xs text-gray-600 truncate">{item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}</span>
            <span className="text-xs font-medium flex-shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3 space-y-1.5 mb-4">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="font-medium">₦{subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Service fee (3.5%)</span><span className="font-medium text-gray-600">₦{serviceFee.toLocaleString()}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Delivery</span><span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span></div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-base font-bold text-[#6C3FC5]">₦{total.toLocaleString()}</span>
      </div>
      {showButton && (
        <button
          onClick={() => step === 0 ? setStep(1) : handlePaystack()}
          disabled={loading}
          className="w-full mt-4 py-3 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {step === 0 ? 'Proceed to delivery →' : `Pay ₦${total.toLocaleString()} →`}
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></Link>
          <StepTracker current={step} />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secure checkout
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Left */}
          <div>
            {/* Step 0: Review cart */}
            {step === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-[#1A1A2E]">Review your cart</p>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border-b border-gray-50 last:border-0">
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl bg-[#F0EBFF]">{item.product_type === 'digital' ? '📄' : '📦'}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#1A1A2E] mb-0.5">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mb-1">{item.store_name}</p>
                      {item.product_type === 'digital' && <span className="text-[10px] bg-[#F0EBFF] text-[#6C3FC5] px-2 py-0.5 rounded-full">Digital — instant delivery</span>}
                    </div>
                    <span className="text-sm font-semibold text-[#1A1A2E]">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Delivery */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-[#1A1A2E] mb-4">Delivery information</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                        <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Amaka Okafor" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone number</label>
                        <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 801 234 5678" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="amaka@example.com" className={inputCls} />
                    </div>
                    {items.some(i => i.product_type === 'physical') && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Delivery address</label>
                          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 Adeola Odeku Street, Victoria Island" className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
                            <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                              <option value="">Select state...</option>
                              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                            <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                              <option value="">Select city...</option>
                              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Delivery note <span className="font-normal text-gray-400">(optional)</span></label>
                          <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} placeholder="e.g. Call before delivery, gate code is 1234..." className={`${inputCls} resize-none`} />
                        </div>
                      </>
                    )}
                    {items.some(i => i.product_type === 'digital') && (
                      <div className="bg-[#F0EBFF] rounded-lg px-3 py-2.5 flex items-start gap-2">
                        <span className="text-sm mt-0.5">✉️</span>
                        <p className="text-xs text-[#2D1B5E]">Your digital products will be sent to your email address immediately after payment is confirmed.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                ← Back
              </button>
            )}
          </div>

          {/* Right: order summary */}
          <div>
            <OrderSummary showButton={true} />
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-[10px] text-gray-400">💳 Paystack</span>
              <span className="text-[10px] text-gray-400">🛡 Buyer protected</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
