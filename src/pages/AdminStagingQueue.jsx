import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, LogOut, RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPatch, apiPost, apiDelete } from '../lib/api'

const REVIEW_FILTERS = ['pending', 'approved', 'rejected', 'all']
const SAVE_DEBOUNCE_MS = 800

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function EditField({ label, value, onChange, type = 'text', rows, readOnly }) {
  if (readOnly) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-stone-500">{label}</p>
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {value || '—'}
        </p>
      </div>
    )
  }
  if (rows) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">{label}</label>
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
        />
      </div>
    )
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

export default function AdminStagingQueue() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [reviewFilter, setReviewFilter] = useState('pending')
  const [queue, setQueue] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [publishStatus, setPublishStatus] = useState('draft')
  const [reviewNotes, setReviewNotes] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  // Editing state
  const [editFields, setEditFields] = useState({})
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const [readOnly, setReadOnly] = useState(false)
  const [reviewedMidSession, setReviewedMidSession] = useState(false)
  const debounceRef = useRef(null)
  const inflightRef = useRef(0)

  const selectedStaging = selected?.staging || null
  const selectedImages = selected?.images || []
  const isPending = selectedStaging?.review_status === 'pending'

  // beforeunload guard
  useEffect(() => {
    const handler = (e) => {
      if (saveStatus === 'error') {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes'
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const loadQueue = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const query = reviewFilter === 'all' ? 'staging' : `staging?review_status=${reviewFilter}`
      const data = await apiGetAuth(query)
      const rows = Array.isArray(data) ? data : []
      setQueue(rows)
    } catch (err) {
      setError(err.message || 'Failed to load staging queue')
    } finally {
      setLoadingList(false)
    }
  }, [reviewFilter])

  const loadDetail = useCallback(async (id) => {
    if (!id) return
    setLoadingDetail(true)
    setError('')
    try {
      const detail = await apiGetAuth(`staging/${id}`)
      setSelected(detail)
      const s = detail?.staging || {}
      setPublishStatus(s.desired_status || 'draft')
      setReviewNotes(s.review_notes || '')
      setReadOnly(s.review_status !== 'pending')
      setReviewedMidSession(false)
      setEditFields({
        title: s.title || '',
        subtitle: s.subtitle || '',
        body: s.body || '',
        category: s.category || '',
        tags: Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || ''),
        author_name: s.author_name || '',
        destination_slug: s.destination_slug || '',
      })
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message || 'Failed to load staging details')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  // Reset or advance selection when the queue contents change
  useEffect(() => {
    if (queue.length === 0) { setSelectedId(null); setSelected(null) }
    else if (!queue.some(r => r.folder === selectedId)) setSelectedId(queue[0].folder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue])

  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId, loadDetail])

  const updateField = (key, value) => {
    if (readOnly) return
    setEditFields(prev => ({ ...prev, [key]: value }))
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      inflightRef.current++
      try {
        await apiPatch(`staging/${selectedId}`, { [key]: value })
        if (--inflightRef.current === 0) setSaveStatus('saved')
        // Sync title in queue list for immediate feedback
        if (key === 'title') {
          setQueue(prev => prev.map(r => r.folder === selectedId ? { ...r, title: value } : r))
        }
      } catch (err) {
        inflightRef.current--
        if (err.message?.includes('409')) {
          setReadOnly(true)
          setReviewedMidSession(true)
        }
        setSaveStatus('error')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const deleteImage = async (img) => {
    const previousImages = selected?.images || []
    // Optimistic: remove immediately
    setSelected(prev => ({
      ...prev,
      images: (prev?.images || []).filter(i => i.stored_filename !== img.stored_filename),
    }))
    try {
      await apiDelete(`staging-images/${selectedId}/${img.stored_filename}`)
    } catch {
      // Restore original image list (preserves order)
      setSelected(prev => ({ ...prev, images: previousImages }))
      setError('Failed to delete image')
    }
  }

  const approveSelected = async () => {
    if (!selectedStaging || !isPending) return
    setActionLoading('approve')
    setError('')
    try {
      await apiPost(`staging/${selectedStaging.folder}/approve`, { status: publishStatus, review_notes: reviewNotes })
      await loadQueue()
      await loadDetail(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Approval failed')
    } finally {
      setActionLoading('')
    }
  }

  const rejectSelected = async () => {
    if (!selectedStaging || !isPending) return
    setActionLoading('reject')
    setError('')
    try {
      await apiPost(`staging/${selectedStaging.folder}/reject`, { review_notes: reviewNotes })
      await loadQueue()
      await loadDetail(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Rejection failed')
    } finally {
      setActionLoading('')
    }
  }

  const queueCountLabel = useMemo(() => `${queue.length} item${queue.length === 1 ? '' : 's'}`, [queue.length])

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-xs text-stone-400 animate-pulse">Saving…</span>
    : saveStatus === 'error'
    ? <span className="text-xs text-red-500">Error</span>
    : <span className="text-xs text-green-600">Saved</span>

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Staging Review Queue</h1>
              <p className="text-stone-400 text-sm mt-1">Review and edit staged article folders</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                <ArrowLeft size={16} /> Dashboard
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-stone-700">Filter</label>
          <select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {REVIEW_FILTERS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
          <button onClick={loadQueue} className="inline-flex items-center gap-2 rounded-lg bg-stone-200 px-3 py-2 text-sm font-medium hover:bg-stone-300">
            <RefreshCw size={16} /> Refresh
          </button>
          <span className="text-sm text-stone-500">{queueCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Queue list */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-1">
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : queue.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">No staging items for this filter.</p>
            ) : (
              <div className="space-y-3">
                {queue.map(row => (
                  <button key={row.folder} onClick={() => setSelectedId(row.folder)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${selectedId === row.folder ? 'border-[#00E676] bg-[#00E676]/10' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'}`}>
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-mono">{row.folder}</p>
                    <p className="font-semibold text-stone-900">{row.title}</p>
                    <p className="text-xs text-stone-600">/{row.slug}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                      <span>{row.image_count || 0} image(s)</span>
                      <span className="uppercase">{row.review_status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
            {loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : !selectedStaging ? (
              <p className="py-16 text-center text-sm text-stone-500">Select a staging item to review.</p>
            ) : (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
                      {selectedStaging.review_status}
                    </span>
                    {!readOnly && saveIndicator}
                    {readOnly && <span className="text-xs text-stone-400 italic">Read-only</span>}
                  </div>
                  <p className="text-xs text-stone-400 font-mono">{selectedStaging.folder}</p>
                </div>

                {(readOnly && selectedStaging.review_status !== 'pending') || reviewedMidSession ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                    This item has been reviewed and can no longer be edited.
                  </div>
                ) : null}

                {/* Editable fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EditField label="Title" value={editFields.title} onChange={v => updateField('title', v)} readOnly={readOnly} />
                  <EditField label="Category" value={editFields.category} onChange={v => updateField('category', v)} readOnly={readOnly} />
                  <EditField label="Author" value={editFields.author_name} onChange={v => updateField('author_name', v)} readOnly={readOnly} />
                  <EditField label="Tags (comma-separated)" value={editFields.tags} onChange={v => updateField('tags', v)} readOnly={readOnly} />
                  <div className="md:col-span-2">
                    <EditField label="Subtitle" value={editFields.subtitle} onChange={v => updateField('subtitle', v)} readOnly={readOnly} />
                  </div>
                  <EditField label="Destination slug" value={editFields.destination_slug} onChange={v => updateField('destination_slug', v)} readOnly={readOnly} />
                </div>

                {/* Body */}
                <EditField label="Body" value={editFields.body} onChange={v => updateField('body', v)} rows={10} readOnly={readOnly} />

                {/* Images */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-700">Staged Images ({selectedImages.length})</p>
                  {selectedImages.length === 0 ? (
                    <p className="text-sm text-stone-500">No images in staging.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {selectedImages.map(img => (
                        <div key={img.stored_filename} className="group relative rounded-lg border border-stone-200 bg-stone-50 p-2">
                          <img src={img.url} alt={img.original_filename} className="aspect-square w-full rounded object-cover" />
                          {isPending && (
                            <button
                              onClick={() => deleteImage(img)}
                              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full shadow"
                              title="Delete image"
                            >
                              <X size={12} />
                            </button>
                          )}
                          <p className="mt-1 truncate text-[11px] text-stone-600">{img.original_filename}</p>
                          <p className="text-[10px] uppercase text-stone-500">{img.role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved/rejected banner */}
                {!isPending && selectedStaging.final_article_id ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Published to article #{selectedStaging.final_article_id}
                    {selectedStaging.review_notes ? ` — ${selectedStaging.review_notes}` : ''}
                  </div>
                ) : null}

                {/* Approve/reject controls */}
                {isPending && (
                  <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Publish As</label>
                        <select value={publishStatus} onChange={e => setPublishStatus(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Reviewer Notes</label>
                        <input value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Optional notes" className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={approveSelected} disabled={actionLoading !== ''} className="inline-flex items-center gap-2 rounded-lg bg-[#00E676] px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-[#00c853] disabled:opacity-60">
                        {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {`Approve (${publishStatus})`}
                      </button>
                      <button onClick={rejectSelected} disabled={actionLoading !== ''} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
