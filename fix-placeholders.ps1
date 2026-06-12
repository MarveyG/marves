# Run this in PowerShell inside your marves project folder
# cd C:\Users\marve\Documents\marves
# Then: powershell -ExecutionPolicy Bypass -File fix-placeholders.ps1

$pages = @{
  "src\pages\marketplace\HomePage.jsx"       = "export default function HomePage() { return null }"
  "src\pages\marketplace\BrowsePage.jsx"     = "export default function BrowsePage() { return null }"
  "src\pages\marketplace\ProductPage.jsx"    = "export default function ProductPage() { return null }"
  "src\pages\marketplace\StorePage.jsx"      = "export default function StorePage() { return null }"
  "src\pages\marketplace\CartPage.jsx"       = "export default function CartPage() { return null }"
  "src\pages\marketplace\CheckoutPage.jsx"   = "export default function CheckoutPage() { return null }"
  "src\pages\marketplace\OrderConfirmPage.jsx" = "export default function OrderConfirmPage() { return null }"
  "src\pages\vendor\OnboardingPage.jsx"      = "export default function OnboardingPage() { return null }"
  "src\pages\vendor\DashboardPage.jsx"       = "export default function DashboardPage() { return null }"
  "src\pages\vendor\ProductsPage.jsx"        = "export default function ProductsPage() { return null }"
  "src\pages\vendor\AddProductPage.jsx"      = "export default function AddProductPage() { return null }"
  "src\pages\vendor\ImportPage.jsx"          = "export default function ImportPage() { return null }"
  "src\pages\vendor\OrdersPage.jsx"          = "export default function OrdersPage() { return null }"
  "src\pages\vendor\SettingsPage.jsx"        = "export default function SettingsPage() { return null }"
  "src\pages\vendor\AnalyticsPage.jsx"       = "export default function AnalyticsPage() { return null }"
  "src\pages\admin\AdminDashboard.jsx"       = "export default function AdminDashboard() { return null }"
}

foreach ($path in $pages.Keys) {
  Set-Content -Path $path -Value $pages[$path] -Encoding UTF8
  Write-Host "Fixed: $path"
}

Write-Host ""
Write-Host "All placeholder files fixed!" -ForegroundColor Green
