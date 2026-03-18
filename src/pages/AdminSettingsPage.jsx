import { useEffect, useState } from 'react'
import { Eye, EyeOff, CheckCircle2, Loader2, X } from 'lucide-react'
import { apiGet, apiPut } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

const FIELDS = [
  { key: 'site_name',        label: 'Site Name',        placeholder: 'Travel Times Sri Lanka' },
  { key: 'site_tagline',     label: 'Tagline',          placeholder: 'Stories from the island' },
  { key: 'contact_email',    label: 'Contact Email',    placeholder: 'hello@example.com', type: 'email' },
  { key: 'social_instagram', label: 'Instagram URL',    placeholder: 'https://instagram.com/...' },
  { key: 'social_facebook',  label: 'Facebook URL',     placeholder: 'https://facebook.com/...' },
  { key: 'social_twitter',   label: 'X / Twitter URL',  placeholder: 'https://x.com/...' },
]

const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"

export default function AdminSettingsPage() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    apiGet('settings')
      .then(data => setValues(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await apiPut('settings', values)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader title="Settings" />

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#00E676]" size={28} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5 pb-16">

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              <X size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* General settings */}
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">General</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {FIELDS.map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={values[f.key] || ''}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Unsplash */}
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Unsplash Integration</p>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Unsplash Access Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={values.unsplash_access_key || ''}
                    onChange={e => setValues(v => ({ ...v, unsplash_access_key: e.target.value }))}
                    placeholder="Your Unsplash API access key"
                    className={inputCls + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">
                Get a free key at <strong>unsplash.com/developers</strong> → "New Application".
                Also set <code className="bg-stone-100 px-1 rounded text-[11px]">UNSPLASH_ACCESS_KEY</code> in your
                Hostinger environment variables for the server to use it.
              </p>
            </div>
          </section>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-4 bg-stone-950 hover:bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-colors shadow-xl disabled:opacity-60"
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
              : saved
              ? <><CheckCircle2 size={16} className="text-[#00E676]" /> Settings Saved</>
              : 'Save Settings'
            }
          </button>
        </div>
      )}
    </div>
  )
}
