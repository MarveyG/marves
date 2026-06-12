import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { label: 'All',              emoji: '🛍' },
  { label: 'Fashion & Clothing', emoji: '👗' },
  { label: 'Beauty & Personal Care', emoji: '✨' },
  { label: 'Food & Drinks',    emoji: '🍱' },
  { label: 'Electronics & Gadgets', emoji: '📱' },
  { label: 'Digital Products', emoji: '💾' },
  { label: 'Home & Living',    emoji: '🏠' },
  { label: 'Art & Crafts',     emoji: '🎨' },
  { label: 'Health & Wellness',emoji: '💊' },
]

// ── NAV ───────────────────────────────────────────────────
function Nav({ cartCount }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/browse?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-lg font-semibold text-[#2D1B5E]">
            Mar<span className="text-[#6C3FC5]">ves</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-[#6C3FC5] focus-within:ring-2 focus-within:ring-[#6C3FC5]/10 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, stores, categories…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/browse" className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hidden sm:block">
            Browse
          </Link>
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-200 rounded-lg hidden sm:block">
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-medium text-white bg-[#6C3FC5] hover:bg-[#5A31A8] px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
            Start selling
          </Link>
          <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#6C3FC5] transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6C3FC5] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-[0_8px_24px_rgba(108,63,197,0.12)] hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {product.product_type === 'digital' ? '📄' : '📦'}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">New</span>
            )}
            {hasDiscount && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">{discountPct}% off</span>
            )}
            {product.product_type === 'digital' && (
              <span className="px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] text-[10px] font-semibold rounded-full">Digital</span>
            )}
          </div>

          {/* Wishlist */}
          <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 text-gray-400">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>

          {/* Add to cart on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={e => { e.preventDefault(); onAddToCart(product) }}
              className="w-full py-2 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </Link>

      <div className="p-3">
        <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          {product.store?.name || 'Marves Store'}
        </p>
        <Link to={`/product/${product.id}`}>
          <p className="text-xs font-medium text-[#1A1A2E] leading-snug mb-2 line-clamp-2 hover:text-[#6C3FC5] transition-colors">
            {product.name}
          </p>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#6C3FC5]">
            ₦{Number(product.price).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₦{Number(product.compare_at_price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── VENDOR CARD ───────────────────────────────────────────
function VendorCard({ store }) {
  return (
    <Link to={`/store/${store.slug}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(108,63,197,0.1)] hover:-translate-y-0.5 transition-all duration-200 block">
      {/* Banner */}
      <div className="h-14 bg-gradient-to-br from-[#F0EBFF] to-[#C4AAFF] relative">
        {store.banner_url && (
          <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        {/* Avatar */}
        <div className="absolute -bottom-5 left-3 w-10 h-10 rounded-full border-2 border-white bg-[#6C3FC5] flex items-center justify-center text-white text-sm font-bold shadow-sm">
          {store.logo_url
            ? <img src={store.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
            : store.name?.slice(0, 2).toUpperCase()
          }
        </div>
      </div>

      <div className="pt-7 px-3 pb-3">
        <p className="text-xs font-semibold text-[#1A1A2E] mb-0.5">{store.name}</p>
        <p className="text-[10px] text-gray-400 mb-2">{store.category} · {store.city}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">{store.product_count || 0} products</span>
          <span className="text-[10px] font-medium text-[#6C3FC5]">Visit store →</span>
        </div>
      </div>
    </Link>
  )
}

// ── SKELETON LOADER ───────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const { addItem, items } = useCartStore()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)

    // Load products with store info
    const { data: productsData } = await supabase
      .from('products')
      .select('*, store:stores(name, slug, logo_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    // Load stores with product counts
    const { data: storesData } = await supabase
      .from('stores')
      .select('*, products(count)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)

    setProducts(productsData || [])
    setStores((storesData || []).map(s => ({
      ...s,
      product_count: s.products?.[0]?.count || 0
    })))
    setLoading(false)
  }

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      store_id: product.store_id,
      store_name: product.store?.name,
      product_type: product.product_type,
    })
    toast.success('Added to cart!')
  }

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav cartCount={cartCount} />

      {/* HERO */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-semibold text-[#6C3FC5] uppercase tracking-widest mb-3">
              Nigeria's Creative Marketplace
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#2D1B5E] leading-tight mb-4">
              Discover products from<br />
              businesses you'll <span className="text-[#6C3FC5]">love</span>
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-md">
              Shop thousands of products from independent Nigerian vendors — fashion, beauty, digital goods, and more.
            </p>
            <div className="flex items-center gap-3 mb-6">
              <Link to="/browse"
                className="px-5 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors">
                Shop now
              </Link>
              <Link to="/register"
                className="px-5 py-2.5 border-2 border-[#6C3FC5] text-[#6C3FC5] hover:bg-[#F0EBFF] text-sm font-medium rounded-lg transition-colors">
                Start selling free
              </Link>
            </div>
            <div className="flex items-center gap-5">
              {[
                { val: `${stores.length}+`, label: 'Vendors' },
                { val: `${products.length}+`, label: 'Products' },
                { val: 'Free', label: 'To join' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-base font-semibold text-[#2D1B5E]">{s.val}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden sm:grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p, i) => (
              <Link key={i} to={`/product/${p.id}`}
                className={`rounded-xl overflow-hidden bg-gray-100 ${i === 0 ? 'row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '1/2' : '1/1' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F0EBFF]">
                    {p.product_type === 'digital' ? '📄' : '📦'}
                  </div>
                )}
              </Link>
            ))}
            {products.length === 0 && [0,1,2,3].map(i => (
              <div key={i} className={`rounded-xl bg-[#F0EBFF] animate-pulse ${i === 0 ? 'row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '1/2' : '1/1' }} />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white border-b border-gray-100 sticky top-14 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all
                  ${activeCategory === cat.label
                    ? 'bg-[#6C3FC5] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3FC5] hover:text-[#6C3FC5]'
                  }`}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* TRENDING PRODUCTS */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-[#2D1B5E]">
                {activeCategory === 'All' ? 'Trending right now' : activeCategory}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeCategory === 'All' ? 'Hand-picked from the best stores on Marves' : `Browse all ${activeCategory} products`}
              </p>
            </div>
            <Link to="/browse" className="text-sm text-[#6C3FC5] font-medium hover:underline">
              See all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-medium text-gray-600 mb-1">No products in this category yet</p>
              <p className="text-xs text-gray-400">Check back soon or browse all categories</p>
              <button onClick={() => setActiveCategory('All')}
                className="mt-4 px-4 py-2 text-sm text-[#6C3FC5] border border-[#6C3FC5] rounded-lg hover:bg-[#F0EBFF] transition-colors">
                Browse all products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </section>

        {/* FEATURED STORES */}
        {stores.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-[#2D1B5E]">Stores to discover</h2>
                <p className="text-sm text-gray-400 mt-0.5">Independent vendors you'll love shopping from</p>
              </div>
              <Link to="/browse" className="text-sm text-[#6C3FC5] font-medium hover:underline">
                Browse all stores →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stores.map(s => <VendorCard key={s.id} store={s} />)}
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="bg-[#F0EBFF] rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-[#2D1B5E]">Start selling on Marves — it's free</h2>
            <p className="text-sm text-gray-500 mt-1">Open your store in under 5 minutes. We only earn when you do.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              { n: '1', title: 'Create your store', desc: 'Sign up in minutes, pick your store name, and customise your storefront.' },
              { n: '2', title: 'List your products', desc: 'Add photos and prices easily. Sell physical goods, digital files, or both.' },
              { n: '3', title: 'Start earning', desc: 'Get orders via WhatsApp and email. We take a small commission only when you make a sale.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-9 h-9 rounded-full bg-[#6C3FC5] text-white text-sm font-semibold flex items-center justify-center mx-auto mb-3">
                  {step.n}
                </div>
                <p className="text-sm font-semibold text-[#2D1B5E] mb-1">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/register"
              className="inline-block px-8 py-3 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors">
              Open your free store →
            </Link>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="bg-[#2D1B5E] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <span className="text-lg font-semibold text-white">
                Mar<span className="text-[#C4AAFF]">ves</span>
              </span>
              <p className="text-xs text-white/50 mt-2 leading-relaxed max-w-xs">
                Your store. Your brand. Your market. Nigeria's home for independent sellers.
              </p>
            </div>
            {[
              { title: 'Marketplace', links: ['Browse all', 'Categories', 'New arrivals'] },
              { title: 'Sell on Marves', links: ['Start selling', 'Vendor dashboard', 'Help centre'] },
              { title: 'Company', links: ['About us', 'Contact', 'Terms of service', 'Privacy policy'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">{col.title}</p>
                <div className="space-y-2">
                  {col.links.map(l => (
                    <p key={l} className="text-xs text-white/50 hover:text-white cursor-pointer transition-colors">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/30">© 2026 Marves · Made with love in Nigeria 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
