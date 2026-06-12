import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// Marketplace pages
import HomePage        from './pages/marketplace/HomePage'
import BrowsePage      from './pages/marketplace/BrowsePage'
import ProductPage     from './pages/marketplace/ProductPage'
import StorePage       from './pages/marketplace/StorePage'
import CartPage        from './pages/marketplace/CartPage'
import CheckoutPage    from './pages/marketplace/CheckoutPage'
import OrderConfirmPage from './pages/marketplace/OrderConfirmPage'

// Vendor pages
import OnboardingPage  from './pages/vendor/OnboardingPage'
import DashboardPage   from './pages/vendor/DashboardPage'
import ProductsPage    from './pages/vendor/ProductsPage'
import AddProductPage  from './pages/vendor/AddProductPage'
import ImportPage      from './pages/vendor/ImportPage'
import OrdersPage      from './pages/vendor/OrdersPage'
import SettingsPage    from './pages/vendor/SettingsPage'
import AnalyticsPage   from './pages/vendor/AnalyticsPage'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'

// Auth
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'

function ProtectedRoute({ children, requiredRole }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [])

  if (session === undefined) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public marketplace */}
      <Route path="/"                element={<HomePage />} />
      <Route path="/browse"          element={<BrowsePage />} />
      <Route path="/browse/:category" element={<BrowsePage />} />
      <Route path="/product/:id"     element={<ProductPage />} />
      <Route path="/store/:slug"     element={<StorePage />} />
      <Route path="/cart"            element={<CartPage />} />
      <Route path="/checkout"        element={<CheckoutPage />} />
      <Route path="/order/:ref"      element={<OrderConfirmPage />} />

      {/* Auth */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={
        <ProtectedRoute><OnboardingPage /></ProtectedRoute>
      } />

      {/* Vendor dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="vendor"><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/products" element={
        <ProtectedRoute requiredRole="vendor"><ProductsPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/products/new" element={
        <ProtectedRoute requiredRole="vendor"><AddProductPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/products/import" element={
        <ProtectedRoute requiredRole="vendor"><ImportPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/orders" element={
        <ProtectedRoute requiredRole="vendor"><OrdersPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/settings" element={
        <ProtectedRoute requiredRole="vendor"><SettingsPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/analytics" element={
        <ProtectedRoute requiredRole="vendor"><AnalyticsPage /></ProtectedRoute>
      } />

      {/* Super admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
