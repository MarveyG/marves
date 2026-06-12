// =============================================
// MARVES PRODUCT IMPORT PARSER
// Handles CSV and raw text imports
// =============================================

const REQUIRED_FIELDS = ['name', 'price']

const VALID_CATEGORIES = [
  'Fashion & Clothing', 'Beauty & Personal Care', 'Food & Drinks',
  'Electronics & Gadgets', 'Home & Living', 'Health & Wellness',
  'Digital Products', 'Art & Crafts', 'Books & Stationery',
  'Agriculture & Farm', 'Automotive', 'Services', 'Other'
]

const VALID_TYPES = ['physical', 'digital']

// ── CSV PARSER ─────────────────────────────
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one product row.')
  }

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().toLowerCase().replace(/ /g, '_'))

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || values.every(v => !v)) continue
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || ''
    })
    rows.push({ rowNumber: i + 1, raw: row })
  }

  return rows.map(({ rowNumber, raw }) => validateAndTransform(raw, rowNumber))
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}

// ── VALIDATOR & TRANSFORMER ─────────────────
function validateAndTransform(raw, rowNumber) {
  const errors = []
  const parsed = {}

  REQUIRED_FIELDS.forEach(field => {
    if (!raw[field]) errors.push(`"${field}" is required`)
  })

  parsed.name = raw.name || ''
  parsed.description = raw.description || ''

  if (raw.category) {
    const match = VALID_CATEGORIES.find(
      c => c.toLowerCase() === raw.category.toLowerCase()
    )
    parsed.category = match || 'Other'
  } else {
    parsed.category = 'Other'
  }

  parsed.product_type = raw.product_type &&
    VALID_TYPES.includes(raw.product_type.toLowerCase())
    ? raw.product_type.toLowerCase()
    : 'physical'

  const price = parseFloat(String(raw.price).replace(/[₦,\s]/g, ''))
  if (isNaN(price) || price <= 0) {
    errors.push('"price" must be a valid number greater than 0')
  } else {
    parsed.price = price
  }

  if (raw.compare_at_price) {
    const cap = parseFloat(String(raw.compare_at_price).replace(/[₦,\s]/g, ''))
    if (!isNaN(cap) && cap > 0) parsed.compare_at_price = cap
  }

  if (raw.unlimited_stock?.toLowerCase() === 'true') {
    parsed.unlimited_stock = true
    parsed.stock_quantity = 0
  } else {
    parsed.unlimited_stock = false
    const qty = parseInt(raw.stock_quantity)
    parsed.stock_quantity = isNaN(qty) ? 0 : qty
  }

  if (raw.sku) parsed.sku = raw.sku
  if (raw.weight_kg) {
    const w = parseFloat(raw.weight_kg)
    if (!isNaN(w)) parsed.weight = w
  }
  if (raw.delivery_days) parsed.delivery_days = raw.delivery_days
  if (raw.tags) {
    parsed.tags = raw.tags.split(',').map(t => t.trim()).filter(Boolean)
  }

  return {
    rowNumber,
    raw,
    parsed: errors.length === 0 ? parsed : null,
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors
  }
}

// ── SUMMARY ────────────────────────────────
export function getImportSummary(rows) {
  const valid = rows.filter(r => r.status === 'valid')
  const invalid = rows.filter(r => r.status === 'invalid')
  return {
    total: rows.length,
    valid: valid.length,
    invalid: invalid.length,
    errors: invalid.map(r => ({
      row: r.rowNumber,
      name: r.raw?.name || `Row ${r.rowNumber}`,
      errors: r.errors
    }))
  }
}

// ── TEMPLATE DOWNLOADER ─────────────────────
export function downloadCSVTemplate() {
  const headers = [
    'name', 'description', 'category', 'product_type',
    'price', 'compare_at_price', 'stock_quantity',
    'unlimited_stock', 'sku', 'weight_kg', 'delivery_days', 'tags'
  ]
  const example = [
    'Ankara wrap dress',
    'Premium Ankara fabric wrap dress with floral print',
    'Fashion & Clothing',
    'physical',
    '2700', '3500', '10', 'FALSE',
    'AWD-001', '0.5', '2-4 days',
    'ankara,dress,women'
  ]
  const csv = [headers.join(','), example.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'marves-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── BULK INSERT TO SUPABASE ─────────────────
export async function importProductsToSupabase(validRows, storeId, vendorId, supabase) {
  const products = validRows.map(row => ({
    ...row.parsed,
    store_id: storeId,
    vendor_id: vendorId,
    status: 'active'
  }))

  const results = { success: 0, errors: [] }
  const chunkSize = 50

  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize)
    const { error } = await supabase.from('products').insert(chunk)
    if (error) {
      results.errors.push(error.message)
    } else {
      results.success += chunk.length
    }
  }

  return results
}
