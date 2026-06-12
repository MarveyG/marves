import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function OrderConfirmPage() {
  const { ref } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      const { data: orderData } = await supabase
        .from('orders').select('*').eq('order_ref', ref).single()
      if (!orderData) { setLoading(false); return }
      setOrder(orderData)

      const { data: itemsData } = await supabase
        .from('order_items').select('*').eq('order_id', orderData.id)
      setItems(itemsData || [])
      setLoading(false)
    }
    loadOrder()
  }, [ref])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6C3FC5] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const hasPhysical = items.some(i => i.product_type === 'physical')
  const hasDigital = items.some(i => i.product_type === 'digital')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="text-lg font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-[#F0EBFF] flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✅</span>
        </div>

        <p className="text-xs font-semibold text-[#6C3FC5] uppercase tracking-widest mb-2">Order confirmed</p>
        <h1 className="text-2xl font-bold text-[#2D1B5E] mb-3">Your order is confirmed!</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Thank you for your order. You'll receive a confirmation email and the vendor will be notified immediately.
        </p>

        {/* Order ref */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-6">
          <span className="text-xs text-gray-500">Order reference</span>
          <span className="text-sm font-bold text-[#1A1A2E]">#{ref}</span>
        </div>

        {/* What happens next */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#F0EBFF] flex items-center justify-center flex-shrink-0">✉️</div>
            <div>
              <p className="text-xs font-semibold text-[#1A1A2E]">Confirmation email sent</p>
              <p className="text-[10px] text-gray-400">Check {order?.customer_email}</p>
            </div>
          </div>
          {hasDigital && (
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#F0EBFF] flex items-center justify-center flex-shrink-0">⚡</div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A2E]">Digital product delivered</p>
                <p className="text-[10px] text-gray-400">Download link sent to your email</p>
              </div>
            </div>
          )}
          {hasPhysical && (
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#F0EBFF] flex items-center justify-center flex-shrink-0">🚚</div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A2E]">Physical items being prepared</p>
                <p className="text-[10px] text-gray-400">Estimated delivery: 2–5 days · {order?.delivery_city}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/" className="block w-full py-3 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors">
            Continue shopping
          </Link>
          <Link to="/browse" className="block w-full py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-300 transition-colors">
            Browse more products
          </Link>
        </div>
      </div>
    </div>
  )
}
