import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Fashion & Clothing', 'Beauty & Personal Care', 'Food & Drinks',
  'Electronics & Gadgets', 'Home & Living', 'Health & Wellness',
  'Digital Products', 'Art & Crafts', 'Books & Stationery',
  'Agriculture & Farm', 'Automotive', 'Services', 'Other'
]

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Other']

function Nav({ cartCount }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-lg font-semibold text-[#2D1B5E] flex-shrink-0">
          Mar<span className="text-[#6C3FC5]">ves</span>
        </Link>
        <div className="flex-1" />
        <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#6C3FC5] transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6C3FC5] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">{cartCount}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}

function ProductCard({ product, onAddToCart }) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-[0_8px_24px_rgba(108,63,197,0.1)] hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {product.product_type === 'digital' ? '📄' : '📦'}
            </div>
          )}
          {product.product_type === 'digital' && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#F0EBFF] text-[#6C3FC5] text-[10px] font-semibold rounded-full">Digital</span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button onClick={e => { e.preventDefault(); onAddToCart(product) }}
              className="w-full py-2 bg-[#6C3FC5] text-white text-xs font-medium rounded-lg">
              Add to cart
            </button>
          </div>
        </div>
      </Link>
      <div className="p-3">
        <p className="text-[10px] text-gray-400 mb-1">{product.store?.name}</p>
        <Link to={`/product/${product.id}`}>
          <p className="text-xs font-medium text-[#1A1A2E] line-clamp-2 mb-2 hover:text-[#6C3FC5]">{product.name}</p>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#6C3FC5]">₦{Number(product.price).toLocaleString()}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">₦{Number(product.compare_at_price).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    type: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  })
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const { addItem, items } = useCartStore()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => { loadProducts() }, [filters, search])

  const loadProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, store:stores(name, slug)', { count: 'exact' })
      .eq('status', 'active')

    if (search) query = query.ilike('name', `%${search}%`)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.type) query = query.eq('product_type', filters.type)
    if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice))
    if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice))

    if (filters.sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (filters.sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (filters.sort === 'price_desc') query = query.order('price', { ascending: false })

    query = query.limit(24)
    const { data, count } = await query
    setProducts(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const handleAddToCart = (product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images?.[0], store_id: product.store_id, store_name: product.store?.name, product_type: product.product_type })
    toast.success('Added to cart!')
  }

  const clearFilters = () => setFilters({ category: '', type: '', city: '', minPrice: '', maxPrice: '', sort: 'newest' })
  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length

  const inputCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6C3FC5] bg-white"

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav cartCount={cartCount} />
      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#6C3FC5] bg-white"
            />
            <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#6C3FC5] bg-white">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
            </select>
          </div>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${total} products found`}
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="ml-3 text-xs text-[#6C3FC5] hover:underline">
                Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
              </button>
            )}
          </p>
        </div>

        <div className="flex gap-5">
          {/* Sidebar filters */}
          <aside className="w-48 flex-shrink-0 space-y-4 hidden md:block">

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Category</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={filters.category === ''} onChange={() => setFilter('category', '')} className="accent-[#6C3FC5]" />
                  <span className="text-xs text-gray-600">All categories</span>
                </label>
                {CATEGORIES.map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={filters.category === c} onChange={() => setFilter('category', c)} className="accent-[#6C3FC5]" />
                    <span className="text-xs text-gray-600">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Product type</p>
              <div className="flex gap-2">
                {['', 'physical', 'digital'].map(t => (
                  <button key={t} onClick={() => setFilter('type', t)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${filters.type === t ? 'bg-[#F0EBFF] border-[#6C3FC5] text-[#6C3FC5]' : 'border-gray-200 text-gray-500'}`}>
                    {t === '' ? 'All' : t === 'physical' ? 'Physical' : 'Digital'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Price range</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="Min ₦" className={inputCls} />
                </div>
                <span className="text-gray-400 text-xs">–</span>
                <div className="flex-1">
                  <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Max ₦" className={inputCls} />
                </div>
              </div>
            </div>

          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm font-medium text-gray-600 mb-1">No products found</p>
                <p className="text-xs text-gray-400 mb-4">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-4 py-2 text-sm text-[#6C3FC5] border border-[#6C3FC5] rounded-lg hover:bg-[#F0EBFF]">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
