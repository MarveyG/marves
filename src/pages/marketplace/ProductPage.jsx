import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [store, setStore] = useState(null)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const { addItem, items } = useCartStore()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => { loadProduct() }, [id])

  const loadProduct = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, store:stores(*)')
      .eq('id', id)
      .single()

    if (!data) { navigate('/browse'); return }
    setProduct(data)
    setStore(data.store)

    // Load related products
    const { data: rel } = await supabase
      .from('products')
      .select('*, store:stores(name, slug)')
      .eq('store_id', data.store_id)
      .eq('status', 'active')
      .neq('id', id)
      .limit(4)
    setRelated(rel || [])

    // Load reviews
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, profile:profiles(full_name)')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
    setReviews(revs || [])

    setLoading(false)
  }

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images?.[0], store_id: product.store_id, store_name: store?.name, product_type: product.product_type }, qty)
    toast.success(`${qty > 1 ? qty + 'x ' : ''}Added to cart!`)
  }

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const hasDiscount = product?.compare_at_price && product.compare_at_price > product.price
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6C3FC5] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></Link>
          <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#6C3FC5] transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6C3FC5] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/" className="hover:text-[#6C3FC5]">Marketplace</Link>
          <span>›</span>
          <Link to="/browse" className="hover:text-[#6C3FC5]">{product.category}</Link>
          <span>›</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Images */}
          <div>
            <div className="aspect-square bg-white border border-gray-200 rounded-xl overflow-hidden mb-3">
              {product.images?.[activeImg] ? (
                <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-[#F0EBFF]">
                  {product.product_type === 'digital' ? '📄' : '📦'}
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-[#6C3FC5]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Vendor */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#6C3FC5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {store?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{store?.name}</p>
                <p className="text-[10px] text-gray-400">{store?.city}</p>
              </div>
              <Link to={`/store/${store?.slug}`} className="text-xs text-[#6C3FC5] font-medium hover:underline">
                Visit store →
              </Link>
            </div>

            <h1 className="text-xl font-semibold text-[#2D1B5E] leading-snug mb-3">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold text-[#6C3FC5]">₦{Number(product.price).toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-gray-400 line-through">₦{Number(product.compare_at_price).toLocaleString()}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{discountPct}% off</span>
                </>
              )}
            </div>

            {/* Rating */}
            {avgRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{avgRating} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{product.description}</p>
            )}

            {/* Meta */}
            <div className="space-y-2 mb-5">
              {product.product_type === 'physical' && (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>🚚</span>
                    <span>Delivered in {product.delivery_days || '2-5 days'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📦</span>
                    <span>{product.unlimited_stock ? 'In stock' : `${product.stock_quantity} units left`}</span>
                  </div>
                </>
              )}
              {product.product_type === 'digital' && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>⚡</span>
                  <span>Instant delivery after payment</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>🔄</span>
                <span>{store?.return_policy ? '7-day returns' : 'Contact store for returns'}</span>
              </div>
            </div>

            <hr className="border-gray-100 mb-5" />

            {/* Qty + CTA */}
            {product.product_type === 'physical' && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg">−</button>
                  <span className="w-8 text-center text-sm font-medium">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg">+</button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <button onClick={handleAddToCart}
                className="flex-1 py-3 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Add to cart
              </button>
              <button className="w-11 h-11 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-all flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </button>
            </div>

            {/* Payment badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500">💳 Paystack</span>
              <span className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500">🛡 Buyer protected</span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
            <h3 className="text-sm font-semibold text-[#2D1B5E] mb-4">
              Customer reviews ({reviews.length})
            </h3>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{r.profile?.full_name || 'Customer'}</span>
                    <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-[#2D1B5E] mb-4">More from {store?.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
                  <Link to={`/product/${p.id}`} className="block">
                    <div className="aspect-square bg-gray-50">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-xs font-medium text-[#1A1A2E] line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-sm font-semibold text-[#6C3FC5]">₦{Number(p.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
