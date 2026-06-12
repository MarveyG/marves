import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

export default function StorePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('products')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState(false)
  const { addItem, items } = useCartStore()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => { loadStore() }, [slug])

  const loadStore = async () => {
    setLoading(true)
    const { data: storeData } = await supabase
      .from('stores').select('*').eq('slug', slug).single()
    if (!storeData) { navigate('/browse'); return }
    setStore(storeData)

    const { data: productsData } = await supabase
      .from('products').select('*').eq('store_id', storeData.id).eq('status', 'active').order('featured', { ascending: false }).order('created_at', { ascending: false })
    setProducts(productsData || [])
    setLoading(false)
  }

  const handleAddToCart = (product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images?.[0], store_id: product.store_id, store_name: store?.name, product_type: product.product_type })
    toast.success('Added to cart!')
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6C3FC5] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Platform nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/" className="text-base font-semibold text-[#2D1B5E]">Mar<span className="text-[#6C3FC5]">ves</span></Link>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search in ${store.name}…`}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6C3FC5] hidden sm:block w-48"
            />
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-700">← Marketplace</Link>
            <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#6C3FC5] transition-colors">
              🛒
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6C3FC5] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">{cartCount}</span>}
              Cart ({cartCount})
            </Link>
          </div>
        </div>
      </nav>

      {/* Store banner */}
      <div className="h-28 bg-gradient-to-br from-[#F0EBFF] to-[#C4AAFF] relative overflow-hidden">
        {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Store header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex items-end gap-4 -mt-7 mb-3">
            <div className="w-14 h-14 rounded-full border-3 border-white bg-[#6C3FC5] flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0 overflow-hidden">
              {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : store.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 pt-8">
              <h1 className="text-lg font-bold text-[#2D1B5E]">{store.name}</h1>
              {store.tagline && <p className="text-xs text-gray-500">{store.tagline} · {store.city}</p>}
            </div>
            <div className="flex items-center gap-2 pt-8">
              {store.whatsapp && (
                <a href={`https://wa.me/${store.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-green-600 hover:border-green-400 transition-colors">
                  💬 Chat
                </a>
              )}
              <button
                onClick={() => setFollowing(f => !f)}
                className={`px-4 py-2 border rounded-lg text-xs font-medium transition-all ${following ? 'bg-[#6C3FC5] border-[#6C3FC5] text-white' : 'border-[#6C3FC5] text-[#6C3FC5] hover:bg-[#F0EBFF]'}`}
              >
                {following ? 'Following ✓' : 'Follow store'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {[
                { val: products.length, label: 'products' },
                { val: store.city || '—', label: 'location' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#2D1B5E]">{s.val}</span>
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {store.instagram && <a href={`https://instagram.com/${store.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-pink-500 text-sm">📷</a>}
              {store.tiktok && <a href={`https://tiktok.com/${store.tiktok}`} target="_blank" rel="noreferrer" className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 text-sm">🎵</a>}
            </div>
          </div>
        </div>

        {/* Notice banner */}
        {store.notice_enabled && store.notice_text && (
          <div className="bg-[#F0EBFF] border-t border-[#C4AAFF] px-4 py-2 flex items-center gap-2">
            <span className="text-sm">📢</span>
            <p className="text-xs text-[#2D1B5E] font-medium">{store.notice_text}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-0 border-t border-gray-100">
          {['products', 'about'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-xs font-medium capitalize transition-all border-b-2 -mb-px
                ${tab === t ? 'border-[#6C3FC5] text-[#6C3FC5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t} {t === 'products' && `(${products.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Products tab */}
        {tab === 'products' && (
          <div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-3xl mb-3">📦</p>
                <p className="text-sm text-gray-500">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <Link to={`/product/${p.id}`} className="block">
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F0EBFF]">
                            {p.product_type === 'digital' ? '📄' : '📦'}
                          </div>
                        )}
                        {p.featured && <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">⭐ Featured</span>}
                        {p.product_type === 'digital' && <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] text-[10px] font-semibold rounded-full">Digital</span>}
                        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                          <button onClick={e => { e.preventDefault(); handleAddToCart(p) }}
                            className="w-full py-2 bg-[#6C3FC5] text-white text-xs font-medium rounded-lg">Add to cart</button>
                        </div>
                      </div>
                    </Link>
                    <div className="p-3">
                      <p className="text-xs font-medium text-[#1A1A2E] line-clamp-2 mb-1">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#6C3FC5]">₦{Number(p.price).toLocaleString()}</span>
                        {p.compare_at_price && <span className="text-xs text-gray-400 line-through">₦{Number(p.compare_at_price).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#2D1B5E] mb-3">About {store.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{store.description || 'No description yet.'}</p>
              </div>
              {store.return_policy && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#2D1B5E] mb-2">🔄 Return & refund policy</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{store.return_policy}</p>
                </div>
              )}
              {store.shipping_policy && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#2D1B5E] mb-2">🚚 Shipping policy</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{store.shipping_policy}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#2D1B5E] mb-3">Contact</h3>
                <div className="space-y-2">
                  {store.whatsapp && (
                    <a href={`https://wa.me/${store.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-green-600">
                      💬 <span>{store.whatsapp}</span>
                    </a>
                  )}
                  {store.instagram && (
                    <a href={`https://instagram.com/${store.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-pink-500">
                      📷 <span>{store.instagram}</span>
                    </a>
                  )}
                  {store.city && <p className="flex items-center gap-2 text-xs text-gray-500">📍 <span>{store.city}, Nigeria</span></p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Powered by Marves */}
      <div className="border-t border-gray-200 py-4 text-center bg-white mt-8">
        <p className="text-xs text-gray-400">
          Powered by <Link to="/" className="text-[#6C3FC5] font-medium hover:underline">Marves</Link> ·{' '}
          <Link to="/register" className="text-[#6C3FC5] hover:underline">Open your free store →</Link>
        </p>
      </div>
    </div>
  )
}
