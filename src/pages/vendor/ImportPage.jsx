import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { parseCSV, getImportSummary, importProductsToSupabase, downloadCSVTemplate } from '../../lib/importParser'
import toast from 'react-hot-toast'

const STEPS = ['Upload file', 'Preview & validate', 'Import']

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all
              ${i < current ? 'bg-[#F0EBFF] text-[#6C3FC5] border-2 border-[#6C3FC5]'
              : i === current ? 'bg-[#6C3FC5] text-white'
              : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block
              ${i <= current ? 'text-[#6C3FC5]' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 sm:w-16 h-px mx-2 ${i < current ? 'bg-[#6C3FC5]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ImportPage() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [store, setStore] = useState(null)
  const [step, setStep] = useState(0)
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase
        .from('stores').select('*').eq('vendor_id', user.id).single()
      if (!data) { navigate('/onboarding'); return }
      setStore(data)
    }
    load()
  }, [])

  const handleFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv'].includes(ext)) {
      toast.error('Please upload a CSV file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result)
        const sum = getImportSummary(parsed)
        setRows(parsed)
        setSummary(sum)
        setStep(1)
      } catch (err) {
        toast.error(err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleImport = async () => {
    setImporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const validRows = rows.filter(r => r.status === 'valid')
    const result = await importProductsToSupabase(validRows, store.id, user.id, supabase)
    setImportResult(result)
    setImporting(false)
    setStep(2)
    if (result.success > 0) {
      toast.success(`${result.success} products imported successfully!`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-[#1A1A2E]">Import products</span>
        </div>
        <button
          onClick={downloadCSVTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#6C3FC5] hover:text-[#6C3FC5] transition-all"
        >
          ⬇ Download CSV template
        </button>
      </div>

      <div className="flex-1 p-5 max-w-3xl mx-auto w-full">
        <StepBar current={step} />

        {/* STEP 0 — Upload */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-[#2D1B5E] mb-1">Import your products</h2>
              <p className="text-sm text-gray-500 mb-5">
                Upload a CSV file with your product data. Download the template to get started with the correct format.
              </p>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${dragOver ? 'border-[#6C3FC5] bg-[#F0EBFF]' : 'border-gray-200 hover:border-[#6C3FC5] hover:bg-[#F0EBFF]'}`}
              >
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drop your CSV file here or <span className="text-[#6C3FC5]">browse</span>
                </p>
                <p className="text-xs text-gray-400">Only CSV files supported · Max 10MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-[#1A1A2E] mb-4">How it works</p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Download the template', desc: 'Click "Download CSV template" above to get the correct column format.' },
                  { step: '2', title: 'Fill in your products', desc: 'Add your product data to the spreadsheet. Required columns: name, price.' },
                  { step: '3', title: 'Upload and preview', desc: 'Upload your filled CSV. We\'ll validate each row and show you any errors.' },
                  { step: '4', title: 'Confirm and import', desc: 'Review the preview and import valid products to your store in one click.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#6C3FC5] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column reference */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-[#1A1A2E] mb-3">CSV column reference</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500 rounded-l-lg">Column</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Required</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 rounded-r-lg">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['name', '✅ Yes', 'Product name'],
                      ['price', '✅ Yes', 'Price in Naira (numbers only, e.g. 2700)'],
                      ['description', 'Optional', 'Product description'],
                      ['category', 'Optional', 'e.g. Fashion & Clothing, Digital Products'],
                      ['product_type', 'Optional', 'physical or digital (default: physical)'],
                      ['compare_at_price', 'Optional', 'Original price for discount display'],
                      ['stock_quantity', 'Optional', 'Number of items in stock'],
                      ['unlimited_stock', 'Optional', 'TRUE or FALSE'],
                      ['sku', 'Optional', 'Your internal product code'],
                      ['weight_kg', 'Optional', 'Weight in kg for physical products'],
                      ['delivery_days', 'Optional', 'e.g. 2-4 days'],
                      ['tags', 'Optional', 'Comma-separated tags e.g. dress,ankara,women'],
                    ].map(([col, req, desc]) => (
                      <tr key={col}>
                        <td className="px-3 py-2 font-mono text-[#6C3FC5] font-medium">{col}</td>
                        <td className="px-3 py-2 text-gray-500">{req}</td>
                        <td className="px-3 py-2 text-gray-500">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Preview */}
        {step === 1 && summary && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-semibold text-[#1A1A2E]">{summary.total}</p>
                <p className="text-xs text-gray-400 mt-1">Total rows</p>
              </div>
              <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-semibold text-green-600">{summary.valid}</p>
                <p className="text-xs text-gray-400 mt-1">Ready to import</p>
              </div>
              <div className={`bg-white border rounded-xl p-4 text-center ${summary.invalid > 0 ? 'border-red-200' : 'border-gray-200'}`}>
                <p className={`text-2xl font-semibold ${summary.invalid > 0 ? 'text-red-500' : 'text-gray-300'}`}>{summary.invalid}</p>
                <p className="text-xs text-gray-400 mt-1">Rows with errors</p>
              </div>
            </div>

            {/* Errors */}
            {summary.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-700 mb-3">⚠ Rows with errors (will be skipped)</p>
                <div className="space-y-2">
                  {summary.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        Row {e.row}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-red-700">{e.name || 'Unnamed product'}</p>
                        <ul className="list-disc list-inside">
                          {e.errors.map((err, j) => (
                            <li key={j} className="text-xs text-red-500">{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid rows preview */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-[#1A1A2E]">Products to import ({summary.valid})</p>
                <button
                  onClick={() => { setStep(0); setRows([]); setSummary(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Upload different file
                </button>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Name', 'Type', 'Price', 'Category', 'Stock', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.filter(r => r.status === 'valid').map((row, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-medium text-[#1A1A2E] max-w-[160px] truncate">{row.parsed.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${row.parsed.product_type === 'digital' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                            {row.parsed.product_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium">₦{Number(row.parsed.price).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{row.parsed.category}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {row.parsed.unlimited_stock ? 'Unlimited' : row.parsed.stock_quantity || '0'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-600">✓ Valid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep(0); setRows([]); setSummary(null) }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || summary.valid === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {importing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                ) : `Import ${summary.valid} product${summary.valid !== 1 ? 's' : ''} →`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Done */}
        {step === 2 && importResult && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0EBFF] flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-xl font-semibold text-[#2D1B5E] mb-2">Import complete!</h2>
            <p className="text-sm text-gray-500 mb-6">
              <span className="text-green-600 font-semibold">{importResult.success} products</span> were successfully added to your store.
              {importResult.errors.length > 0 && (
                <span className="text-red-500"> {importResult.errors.length} batches had errors.</span>
              )}
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Link
                to="/dashboard"
                className="w-full py-2.5 bg-[#6C3FC5] hover:bg-[#5A31A8] text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                View my products →
              </Link>
              <button
                onClick={() => { setStep(0); setRows([]); setSummary(null); setImportResult(null) }}
                className="w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-300 transition-colors"
              >
                Import another file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
