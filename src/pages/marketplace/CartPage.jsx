import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = items.some(i => i.product_type === 'physical') ? 1500 : 0
  const total = subtotal + deliveryFee

  // Group by vendor
  const groups = items.reduce((acc, item) => {
    const key = item.store_id
    if (!acc[key]) acc[key] = { store_name: item.store_name, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></Link>
          <div className="flex items-center gap-3">
            <Link to="/browse" className="text-sm text-gray-500 hover:text-gray-700">← Continue shopping</Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Secure checkout
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-[#2D1B5E] mb-5">
          Your cart {items.length > 0 && <span className="text-gray-400 font-normal text-base">({items.length} item{items.length !== 1 ? 's' : ''})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-5xl mb-4">🛍</p>
            <p className="text-base font-medium text-gray-600 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-6">Browse our marketplace to find products you'll love</p>
            <Link to="/browse" className="px-6 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            {/* Cart items */}
            <div className="space-y-3">
              {Object.values(groups).map((group, gi) => (
                <div key={gi} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Vendor label */}
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                    <span className="text-xs font-medium text-gray-500">{group.store_name}</span>
                  </div>

                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-start gap-3 p-4 border-b border-gray-50 last:border-0">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-[#F0EBFF]">
                            {item.product_type === 'digital' ? '📄' : '📦'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A2E] mb-1 line-clamp-2">{item.name}</p>
                        {item.product_type === 'digital' && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] rounded-full font-medium">Digital</span>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {item.product_type === 'physical' ? (
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-base">−</button>
                              <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-base">+</button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Qty: 1</span>
                          )}
                          <button onClick={() => removeItem(item.id)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-semibold text-[#1A1A2E] flex-shrink-0">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                Clear entire cart
              </button>
            </div>

            {/* Order summary */}
            <div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-4">Order summary</p>

                <div className="space-y-2.5 mb-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[160px]">{item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}</span>
                      <span className="font-medium flex-shrink-0 ml-2">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Delivery</span>
                    <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                      {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  {items.some(i => i.product_type === 'digital') && (
                    <p className="text-[10px] text-gray-400">Digital products delivered instantly by email</p>
                  )}
                </div>

                <div className="flex justify-between items-center mb-5 pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-[#1A1A2E]">Total</span>
                  <span className="text-lg font-bold text-[#6C3FC5]">₦{total.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to checkout →
                </button>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">💳 Paystack</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">🛡 Buyer protected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
