import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { CloudUpload, Loader2, X, Search, CheckCircle2 } from 'lucide-react'
import { apiGet, apiGetAuth, apiPost, apiPut, apiUploadImage } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

const REGIONS = ['Western', 'Central', 'Southern', 'Uva', 'North Central', 'Eastern', 'Northern']

const EMPTY = {
  name: '', slug: '', region: '', tagline: '', description: '',
  status: 'published', lat: null, lng: null, hero_image: null,
  highlights: [], stats: null,
}

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:#00E676;border:3px solid white;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</label>
        {hint && <span className="text-[10px] text-stone-600 normal-case">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

export default function AdminDestinationEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [fields, setFields] = useState(EMPTY)
  const [slugError, setSlugError] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved')
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [heroTab, setHeroTab] = useState('upload')
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [unsplashError, setUnsplashError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const debounceRef = useRef(null)
  const fieldsRef = useRef(fields)
  const fileInputRef = useRef(null)

  // Load existing destination
  const loadDest = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    try {
      const data = await apiGetAuth(`destinations/${id}`)
      if (data?.error) { setError(data.error); return }
      const loaded = {
        name: data.name || '',
        slug: data.slug || '',
        region: data.region || '',
        tagline: data.tagline || '',
        description: data.description || '',
        status: data.status || 'published',
        lat: data.lat != null ? parseFloat(data.lat) : null,
        lng: data.lng != null ? parseFloat(data.lng) : null,
        hero_image: data.hero_image ?? null,
        highlights: data.highlights ?? [],
        stats: data.stats ?? null,
      }
      setFields(loaded)
      fieldsRef.current = loaded
      setUnsplashQuery(`${data.name} Sri Lanka`)
    } catch (err) {
      setError(err.message || 'Failed to load destination')
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => { loadDest() }, [loadDest])
  useEffect(() => { return () => clearTimeout(debounceRef.current) }, [])

  // Autosave (edit mode only)
  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    setFields(next)
    fieldsRef.current = next
    if (isNew) return
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await apiPut(`destinations/${id}`, fieldsRef.current)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setError(err.message || 'Save failed')
      }
    }, 800)
  }

  // Slug blur save (edit mode only — avoids autosave mid-type)
  const handleSlugBlur = async (slug) => {
    if (isNew) return
    setSlugError('')
    try {
      await apiPut(`destinations/${id}`, { ...fieldsRef.current, slug })
      setSaveStatus('saved')
    } catch (err) {
      if (err.message?.includes('Slug already in use')) {
        setSlugError('This slug is already taken — please choose a different one.')
      } else {
        setError(err.message || 'Save failed')
      }
      setSaveStatus('error')
    }
  }

  // Map click — update both lat+lng atomically to avoid partial state
  const handleMapClick = ({ lat, lng }) => {
    const next = { ...fieldsRef.current, lat, lng }
    setFields(next)
    fieldsRef.current = next
    if (!isNew) {
      setSaveStatus('saving')
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          await apiPut(`destinations/${id}`, fieldsRef.current)
          setSaveStatus('saved')
        } catch (err) {
          setSaveStatus('error')
        }
      }, 800)
    }
  }

  // Image upload
  const handleFiles = async (files) => {
    if (isNew) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      const result = await apiUploadImage(arr[0], 'destination', id, 'hero', '')
      updateField('hero_image', result.url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Unsplash search
  const handleUnsplashSearch = async () => {
    if (!unsplashQuery.trim()) return
    setUnsplashLoading(true)
    setUnsplashError('')
    setUnsplashResults([])
    try {
      const data = await apiGetAuth(`unsplash/search?q=${encodeURIComponent(unsplashQuery)}`)
      if (data?.error) throw new Error(data.error)
      setUnsplashResults(Array.isArray(data) ? data : [])
    } catch (err) {
      setUnsplashError(err.message || 'Search failed')
    } finally {
      setUnsplashLoading(false)
    }
  }

  // Unsplash download + set as hero
  const handleUnsplashSelect = async (photo) => {
    setUploading(true)
    setError('')
    try {
      const result = await apiPost('unsplash/download', {
        id: photo.id,
        regular_url: photo.regular_url,
        photographer_name: photo.photographer_name,
        photographer_url: photo.photographer_url,
        destination_id: id,
      })
      updateField('hero_image', result.url)
    } catch (err) {
      setError(err.message || 'Failed to download photo')
    } finally {
      setUploading(false)
    }
  }

  // Create destination (new mode)
  const handleCreate = async () => {
    if (!fields.name.trim()) { setError('Name is required'); return }
    setError('')
    try {
      const result = await apiPost('destinations', {
        ...fields,
        slug: fields.slug || fields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      })
      navigate(`/admin/destinations/${result.id}`)
    } catch (err) {
      if (err.message?.includes('Slug already in use')) {
        setSlugError('This slug is already taken — please choose a different one.')
      } else {
        setError(err.message || 'Create failed')
      }
    }
  }

  const hasPin = fields.lat != null && fields.lng != null
  const mapCenter = hasPin ? [fields.lat, fields.lng] : [7.8731, 80.7718]

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#00E676]" size={28} />
    </div>
  )

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title={isNew ? 'New Destination' : (fields.name || 'Untitled')}
        action={
          !isNew ? (
            saveStatus === 'saving'
              ? <span className="flex items-center gap-1.5 text-xs text-stone-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>
              : saveStatus === 'saved'
              ? <span className="flex items-center gap-1.5 text-xs text-[#00E676]/70"><CheckCircle2 size={11} /> Saved</span>
              : saveStatus === 'error'
              ? <span className="flex items-center gap-1.5 text-xs text-red-500"><X size={11} /> Save error</span>
              : null
          ) : null
        }
      />
      <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-5 pb-16">

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <X size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic fields */}
          <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Destination Info</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <Field label="Name">
                <input
                  value={fields.name}
                  onChange={e => {
                    const name = e.target.value
                    if (isNew) {
                      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                      setFields(f => ({ ...f, name, slug: autoSlug }))
                      fieldsRef.current = { ...fieldsRef.current, name, slug: autoSlug }
                    } else {
                      updateField('name', name)
                    }
                  }}
                  placeholder="Kandy"
                  className={inputCls}
                />
              </Field>

              <Field label="Slug" error={slugError}>
                <input
                  value={fields.slug}
                  onChange={e => {
                    // Update local state only — DO NOT call updateField (would autosave mid-type)
                    setSlugError('')
                    const next = { ...fieldsRef.current, slug: e.target.value }
                    setFields(next)
                    fieldsRef.current = next
                  }}
                  onBlur={e => handleSlugBlur(e.target.value)}
                  placeholder="kandy"
                  className={inputCls + (slugError ? ' border-red-500' : '')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Region">
                  <select value={fields.region} onChange={e => updateField('region', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={fields.status} onChange={e => updateField('status', e.target.value)} className={inputCls}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
              </div>

              <Field label="Tagline" hint="short descriptor">
                <input
                  value={fields.tagline}
                  onChange={e => updateField('tagline', e.target.value)}
                  placeholder="City of the Sacred Tooth Relic"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={fields.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Longer description of this destination…"
                  rows={4}
                  className={inputCls + " resize-none leading-relaxed"}
                />
              </Field>
            </div>
          </section>

          {/* Map */}
          <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Map Location</p>
              {hasPin && (
                <button
                  onClick={() => {
                    const next = { ...fieldsRef.current, lat: null, lng: null }
                    setFields(next); fieldsRef.current = next
                    if (!isNew) apiPut(`destinations/${id}`, next).catch(() => {})
                  }}
                  className="text-[10px] text-stone-500 hover:text-red-400 transition-colors"
                >
                  Clear pin
                </button>
              )}
            </div>
            <div className="p-0 overflow-hidden rounded-b-2xl" style={{ height: 320 }}>
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={hasPin ? 10 : 7}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  subdomains="abcd"
                  maxZoom={19}
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {hasPin && (
                  <Marker
                    position={[fields.lat, fields.lng]}
                    icon={markerIcon}
                    draggable
                    eventHandlers={{ dragend: (e) => handleMapClick(e.target.getLatLng()) }}
                  />
                )}
              </MapContainer>
            </div>
            {hasPin ? (
              <div className="px-5 py-2 flex items-center gap-2 text-xs text-stone-400 border-t border-stone-100">
                <span className="text-[#00E676]">●</span>
                Lat {fields.lat?.toFixed(4)}, Lng {fields.lng?.toFixed(4)}
                <span className="text-stone-600 ml-1">— click map or drag marker to reposition</span>
              </div>
            ) : (
              <div className="px-5 py-2 text-xs text-stone-500 border-t border-stone-100">
                Click anywhere on the map to drop a pin
              </div>
            )}
          </section>

          {/* Hero image */}
          <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Hero Image</p>
            </div>
            <div className="p-5">
              {/* Current hero preview */}
              {fields.hero_image && (
                <div className="mb-4 relative rounded-xl overflow-hidden aspect-[16/7]">
                  <img src={fields.hero_image} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateField('hero_image', null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {['upload', 'suggest'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setHeroTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                      heroTab === tab
                        ? 'bg-[#00E676] text-stone-950'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
                    }`}
                  >
                    {tab === 'upload' ? 'Upload' : 'Suggest (Free)'}
                  </button>
                ))}
              </div>

              {heroTab === 'upload' && (
                isNew ? (
                  <p className="text-xs text-stone-500 py-4 text-center">Save the destination first to upload images.</p>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-8 transition-all cursor-pointer ${
                      isDragOver ? 'border-[#00E676] bg-[#00E676]/5' : 'border-stone-200 hover:border-[#00E676]/40 bg-stone-50'
                    }`}
                  >
                    {uploading
                      ? <><Loader2 size={22} className="animate-spin text-[#00E676]" /><p className="text-xs text-stone-500">Uploading…</p></>
                      : <><CloudUpload size={22} className="text-stone-500" /><p className="text-sm text-stone-400">Drag & drop or click to upload</p></>
                    }
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
                  </div>
                )
              )}

              {heroTab === 'suggest' && (
                isNew ? (
                  <p className="text-xs text-stone-500 py-4 text-center">Save the destination first to use photo suggestions.</p>
                ) : (
                  <div>
                    <div className="flex gap-2 mb-4">
                      <input
                        value={unsplashQuery}
                        onChange={e => setUnsplashQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUnsplashSearch()}
                        placeholder="e.g. Kandy Sri Lanka"
                        className={inputCls + " flex-1"}
                      />
                      <button
                        onClick={handleUnsplashSearch}
                        disabled={unsplashLoading}
                        className="px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {unsplashLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>

                    {unsplashError && (
                      <p className="text-xs text-red-400 mb-3">
                        {unsplashError.includes('not configured')
                          ? 'Add your Unsplash API key in Site Settings to use this feature.'
                          : unsplashError}
                      </p>
                    )}

                    {uploading && (
                      <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                        <Loader2 size={12} className="animate-spin" /> Downloading photo to server…
                      </div>
                    )}

                    {unsplashResults.length > 0 && (
                      <div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {unsplashResults.map(photo => (
                            <button
                              key={photo.id}
                              onClick={() => handleUnsplashSelect(photo)}
                              disabled={uploading}
                              className="relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-[#00E676] transition-all disabled:opacity-50"
                            >
                              <img src={photo.thumb_url} alt={`Photo by ${photo.photographer_name}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                <span className="text-[9px] text-white/80 leading-tight">{photo.photographer_name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-stone-600">Photos from Unsplash — free to use with attribution</p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* Create button (new mode only) */}
          {isNew && (
            <button
              onClick={handleCreate}
              className="w-full py-4 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors shadow-xl"
            >
              Create Destination
            </button>
          )}

      </div>
    </div>
  )
}
