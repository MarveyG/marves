import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// ── SIDEBAR ────────────────────────────────────────────────
const NAV = [
  { id: 'overview',  label: 'Overview',       icon: '▦' },
  { id: 'products',  label: 'Products',        icon: '⊞' },
  { id: 'orders',    label: 'Orders',          icon: '🛍' },
  { id: 'settings',  label: 'Store settings',  icon: '⚙' },
]

function Sidebar({ active, setActive, store, onSignOut }) {
  return (
    <aside className="w-48 flex-shrink-0 bg-[#2D1B5E] flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <span className="text-base font-semibold text-white">
          Mar<span className="text-[#C4AAFF]">ves</span>
        </span>
      </div>

      {/* Store info */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#6C3FC5] flex items-center justify-center
          text-white text-xs font-semibold flex-shrink-0">
          {store?.name?.charAt(0) || 'S'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{store?.name || 'My Store'}</p>
          <p className="text-[10px] text-white/40 truncate">marves.com/store/{store?.slug}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all text-left
              border-l-2 ${active === item.id
                ? 'bg-[#6C3FC5]/30 border-[#C4AAFF] text-white'
                : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-white/10 space-y-1">
        {store?.slug && (
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 py-1 transition-colors"
          >
            <span>↗</span> View my store
          </a>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 py-1 transition-colors w-full text-left"
        >
          <span>→</span> Sign out
        </button>
      </div>
    </aside>
  )
}

// ── STAT CARD ──────────────────────────────────────────────
function StatCard({ label, value, delta, deltaUp, icon, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-semibold text-[#1A1A2E] mb-1">{value}</p>
      {delta && (
        <p className={`text-xs flex items-center gap-1 ${deltaUp ? 'text-green-500' : 'text-red-400'}`}>
          {deltaUp ? '↑' : '↓'} {delta}
        </p>
      )}
    </div>
  )
}

// ── OVERVIEW TAB ───────────────────────────────────────────
function OverviewTab({ store, products, orders, setActive }) {
  const revenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0)

  const pending = orders.filter(o => o.status === 'pending').length
  const recentOrders = orders.slice(0, 5)

  const statusColor = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-green-50 text-green-700',
    processing: 'bg-purple-50 text-purple-700',
    shipped: 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Revenue" value={`₦${revenue.toLocaleString()}`}
          delta="+18% this month" deltaUp icon="₦" color="bg-purple-50" />
        <StatCard label="Total orders" value={orders.length}
          delta="+12 this week" deltaUp icon="🛍" color="bg-green-50" />
        <StatCard label="Products" value={products.length}
          icon="📦" color="bg-blue-50" />
        <StatCard label="Pending orders" value={pending}
          icon="⏳" color="bg-amber-50" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Add product', icon: '＋', action: () => setActive('products') },
          { label: 'View orders', icon: '🛍', action: () => setActive('orders') },
          { label: 'Share store', icon: '📤', action: () => {
            navigator.clipboard.writeText(`${window.location.origin}/store/${store?.slug}`)
            toast.success('Store link copied!')
          }},
        ].map(a => (
          <button key={a.label} onClick={a.action}
            className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-[#6C3FC5] hover:bg-[#F0EBFF] transition-all group">
            <div className="text-2xl mb-1.5">{a.icon}</div>
            <p className="text-xs font-medium text-gray-600 group-hover:text-[#6C3FC5]">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-[#1A1A2E]">Recent orders</span>
          <button onClick={() => setActive('orders')}
            className="text-xs text-[#6C3FC5] font-medium hover:underline">
            View all
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl mb-2">🛍</p>
            <p className="text-sm text-gray-400">No orders yet — share your store link to get started!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Order</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Customer</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Amount</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-xs font-semibold text-[#1A1A2E]">#{order.order_ref}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{order.customer_name}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-[#1A1A2E]">₦{Number(order.total).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-50 text-gray-500'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── PRODUCTS TAB ───────────────────────────────────────────
function ProductsTab({ products, storeId, onRefresh }) {
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Product deleted'); onRefresh() }
    setDeleting(null)
  }

  const toggleStatus = async (id, current) => {
    const next = current === 'active' ? 'draft' : 'active'
    const { error } = await supabase.from('products').update({ status: next }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success(`Product ${next === 'active' ? 'activated' : 'set to draft'}`); onRefresh() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-[#1A1A2E]">Products</h2>
          <p className="text-xs text-gray-400">{products.length} products listed</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/products/import"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#6C3FC5] hover:text-[#6C3FC5] transition-all">
            ↑ Import
          </Link>
          <Link to="/dashboard/products/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white rounded-lg text-xs font-medium transition-colors">
            ＋ Add product
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm font-medium text-gray-600 mb-1">No products yet</p>
            <p className="text-xs text-gray-400 mb-4">Add your first product to start selling</p>
            <Link to="/dashboard/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6C3FC5] text-white rounded-lg text-xs font-medium">
              ＋ Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Product</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Price</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Stock</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F0EBFF] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-base">📦</span>
                        }
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1A1A2E]">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full
                      ${p.product_type === 'digital' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                      {p.product_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-[#1A1A2E]">
                    ₦{Number(p.price).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {p.unlimited_stock ? 'Unlimited' : `${p.stock_quantity} left`}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleStatus(p.id, p.status)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-all
                        ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/dashboard/products/${p.id}/edit`}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#6C3FC5] hover:text-[#6C3FC5] transition-all text-xs">
                        ✎
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-400 transition-all text-xs">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── ORDERS TAB ─────────────────────────────────────────────
function OrdersTab({ orders, onRefresh }) {
  const [filter, setFilter] = useState('all')

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ]

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusColor = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-green-50 text-green-700',
    processing: 'bg-purple-50 text-purple-700',
    shipped: 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-50 text-red-700',
  }

  const nextStatus = {
    pending: 'confirmed',
    confirmed: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  }

  const actionLabel = {
    pending: 'Confirm',
    confirmed: 'Process',
    processing: 'Ship',
    shipped: 'Delivered',
  }

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('orders').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Order updated'); onRefresh() }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${filter === f.id
                ? 'bg-[#F0EBFF] border-[#6C3FC5] text-[#6C3FC5]'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
            {f.label} ({f.id === 'all' ? orders.length : orders.filter(o => o.status === f.id).length})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🛍</p>
            <p className="text-sm text-gray-400">No orders in this category yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Order ID', 'Customer', 'Amount', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-semibold text-[#1A1A2E]">#{order.order_ref}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#1A1A2E]">{order.customer_name}</p>
                    <p className="text-[10px] text-gray-400">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1A1A2E]">₦{Number(order.total).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-50 text-gray-500'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {nextStatus[order.status] && (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus[order.status])}
                        className="text-[10px] font-medium px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-[#6C3FC5] hover:text-[#6C3FC5] transition-all">
                        {actionLabel[order.status]}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── SETTINGS TAB ───────────────────────────────────────────
function SettingsTab({ store, onRefresh }) {
  const [form, setForm] = useState({
    name: store?.name || '',
    description: store?.description || '',
    category: store?.category || '',
    city: store?.city || '',
    whatsapp: store?.whatsapp || '',
    instagram: store?.instagram || '',
    tiktok: store?.tiktok || '',
    return_policy: store?.return_policy || '',
    shipping_policy: store?.shipping_policy || '',
  })
  const [saving, setSaving] = useState(false)

  const inputClass = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
    focus:border-[#6C3FC5] focus:ring-2 focus:ring-[#6C3FC5]/10`

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('stores').update(form).eq('id', store.id)
    if (error) toast.error(error.message)
    else { toast.success('Settings saved!'); onRefresh() }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-5">

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4 pb-3 border-b border-gray-100">Store profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Store name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Store URL</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <span className="px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200">marves.com/store/</span>
              <span className="px-3 py-2.5 text-xs text-gray-500 flex-1">{store?.slug}</span>
              <span className="px-3 py-2.5 text-xs text-amber-500 flex items-center gap-1">🔒 Locked</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4 pb-3 border-b border-gray-100">Contact & social</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">WhatsApp</label>
            <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})}
              placeholder="+2348012345678" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Instagram</label>
              <input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})}
                placeholder="@yourhandle" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">TikTok</label>
              <input value={form.tiktok} onChange={e => setForm({...form, tiktok: e.target.value})}
                placeholder="@yourhandle" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4 pb-3 border-b border-gray-100">Policies</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Return & refund policy</label>
            <textarea rows={3} value={form.return_policy}
              onChange={e => setForm({...form, return_policy: e.target.value})}
              placeholder="e.g. We accept returns within 7 days..."
              className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Shipping policy</label>
            <textarea rows={3} value={form.shipping_policy}
              onChange={e => setForm({...form, shipping_policy: e.target.value})}
              placeholder="e.g. Orders are processed within 1-2 business days..."
              className={`${inputClass} resize-none`} />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60
          text-white text-sm font-medium rounded-lg transition-colors">
        {saving ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
        ) : '💾 Save changes'}
      </button>
    </div>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: storeData } = await supabase
      .from('stores').select('*').eq('vendor_id', user.id).single()

    if (!storeData) { navigate('/onboarding'); return }
    setStore(storeData)

    const { data: productsData } = await supabase
      .from('products').select('*')
      .eq('store_id', storeData.id)
      .order('created_at', { ascending: false })

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, order_items!inner(*)')
      .eq('order_items.store_id', storeData.id)
      .order('created_at', { ascending: false })

    setProducts(productsData || [])
    setOrders(ordersData || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const tabTitles = {
    overview: 'Overview',
    products: 'Products',
    orders: 'Orders',
    settings: 'Store settings',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 border-3 border-[#6C3FC5] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} store={store} onSignOut={handleSignOut} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 h-12 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-medium text-[#1A1A2E]">{tabTitles[active]}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/store/${store?.slug}`)
              toast.success('Store link copied!')
            }} className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors">
              Share store
            </button>
            <Link to="/dashboard/products/new"
              className="text-xs font-medium bg-[#6C3FC5] text-white rounded-lg px-3 py-1.5 hover:bg-[#5A31A8] transition-colors">
              ＋ Add product
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {active === 'overview' && <OverviewTab store={store} products={products} orders={orders} setActive={setActive} />}
          {active === 'products' && <ProductsTab products={products} storeId={store?.id} onRefresh={fetchData} />}
          {active === 'orders' && <OrdersTab orders={orders} onRefresh={fetchData} />}
          {active === 'settings' && <SettingsTab store={store} onRefresh={fetchData} />}
        </div>
      </div>
    </div>
  )
}
