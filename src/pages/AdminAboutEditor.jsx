import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, LogOut, Upload, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiDelete, apiGetAuth, apiPut, apiUploadImage } from '../lib/api'

const SAVE_DEBOUNCE_MS = 800
const ABOUT_ENTITY_ID = '1'

export default function AdminAboutEditor() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [fields, setFields] = useState({ about_name: '', about_role: '', about_bio: '' })
  const [images, setImages] = useState([])
  const [saveStatus, setSaveStatus] = useState('saved')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const debounceRef = useRef(null)
  const fieldsRef = useRef({})

  const load = useCallback(async () => {
    try {
      const [settings, imgs] = await Promise.all([
        apiGetAuth('settings'),
        apiGetAuth(`images?entity_type=about&entity_id=${ABOUT_ENTITY_ID}`),
      ])
      const f = {
        about_name: settings.about_name ?? '',
        about_role: settings.about_role ?? '',
        about_bio:  settings.about_bio  ?? '',
      }
      setFields(f)
      fieldsRef.current = f
      setImages(Array.isArray(imgs) ? imgs : [])
    } catch (err) {
      setError(err.message || 'Failed to load')
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    fieldsRef.current = next
    setFields(next)
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await apiPut('settings', { [key]: value })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const img = await apiUploadImage(file, 'about', ABOUT_ENTITY_ID, 'gallery', file.name)
      setImages(prev => [...prev, img])
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const deleteImage = async (id) => {
    try {
      await apiDelete(`images/${id}`)
      setImages(prev => prev.filter(img => img.id !== id))
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch { /* ignore */ }
  }

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-xs text-stone-400 animate-pulse">Saving…</span>
    : saveStatus === 'error'
    ? <span className="text-xs text-red-500">Error saving</span>
    : <span className="text-xs text-green-600">Saved</span>

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">About Page</h1>
            <p className="text-stone-400 text-sm mt-0.5">Changes auto-save as you type</p>
          </div>
          <div className="flex items-center gap-3">
            {saveIndicator}
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
            {error}
            <button onClick={() => setError('')}><X size={15} /></button>
          </div>
        )}

        {/* Photo */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Photo</h2>

          {images.length > 0 ? (
            <div className="flex items-start gap-4">
              <div className="group relative w-32 h-32 rounded-2xl overflow-hidden border border-stone-200 shrink-0">
                <img src={images[0].url} alt="About photo" className="w-full h-full object-cover" />
                <button
                  onClick={() => deleteImage(images[0].id)}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full shadow"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2">Hover the photo and click × to replace it.</p>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('about-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-[#00E676] bg-[#00E676]/5' : 'border-stone-300 hover:border-stone-400'}`}
            >
              {uploading
                ? <Loader2 size={24} className="animate-spin mx-auto text-stone-400" />
                : (
                  <>
                    <Upload size={24} className="mx-auto mb-2 text-stone-400" />
                    <p className="text-sm text-stone-500">Drop a photo or click to upload</p>
                  </>
                )
              }
            </div>
          )}
          <input id="about-file-input" type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]) }} />
        </div>

        {/* Bio fields */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Details</h2>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Name</label>
            <input
              type="text"
              value={fields.about_name}
              onChange={e => updateField('about_name', e.target.value)}
              placeholder="e.g. Sanath Weerasuriya"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E676]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Role / Title</label>
            <input
              type="text"
              value={fields.about_role}
              onChange={e => updateField('about_role', e.target.value)}
              placeholder="e.g. Founder & Editor, Travel Journalist"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E676]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Bio</label>
            <textarea
              value={fields.about_bio}
              onChange={e => updateField('about_bio', e.target.value)}
              rows={10}
              placeholder="Write about his career, experience, and story…"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E676] resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
