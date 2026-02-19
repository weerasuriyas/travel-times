import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, LogOut, RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPost } from '../lib/api'

const REVIEW_FILTERS = ['pending', 'approved', 'rejected', 'all']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
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

  const selectedStaging = selected?.staging || null
  const selectedImages = selected?.images || []
  const approvedImages = selected?.approved_images || []

  const isPending = selectedStaging?.review_status === 'pending'

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const loadQueue = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const query = reviewFilter === 'all' ? 'staging' : `staging?review_status=${reviewFilter}`
      const data = await apiGetAuth(query)
      const rows = Array.isArray(data) ? data : []
      setQueue(rows)

      if (rows.length === 0) {
        setSelectedId(null)
        setSelected(null)
        return
      }

      if (!rows.some((row) => row.id === selectedId)) {
        setSelectedId(rows[0].id)
      }
    } catch (err) {
      setError(err.message || 'Failed to load staging queue')
    } finally {
      setLoadingList(false)
    }
  }, [reviewFilter, selectedId])

  const loadDetail = useCallback(async (id) => {
    if (!id) return

    setLoadingDetail(true)
    setError('')
    try {
      const detail = await apiGetAuth(`staging/${id}`)
      setSelected(detail)
      if (detail?.staging?.desired_status) {
        setPublishStatus(detail.staging.desired_status)
      } else {
        setPublishStatus('draft')
      }
      setReviewNotes(detail?.staging?.review_notes || '')
    } catch (err) {
      setError(err.message || 'Failed to load staging details')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId)
    }
  }, [selectedId, loadDetail])

  const approveSelected = async () => {
    if (!selectedStaging || !isPending) return

    setActionLoading('approve')
    setError('')
    try {
      await apiPost(`staging/${selectedStaging.id}/approve`, {
        status: publishStatus,
        review_notes: reviewNotes,
      })
      await loadQueue()
      await loadDetail(selectedStaging.id)
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
      await apiPost(`staging/${selectedStaging.id}/reject`, {
        review_notes: reviewNotes,
      })
      await loadQueue()
      await loadDetail(selectedStaging.id)
    } catch (err) {
      setError(err.message || 'Rejection failed')
    } finally {
      setActionLoading('')
    }
  }

  const queueCountLabel = useMemo(() => `${queue.length} item${queue.length === 1 ? '' : 's'}`, [queue.length])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Staging Review Queue</h1>
              <p className="text-stone-400 text-sm mt-1">Approve or reject staged article folders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-stone-700">Filter</label>
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {REVIEW_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={loadQueue}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-200 px-3 py-2 text-sm font-medium hover:bg-stone-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <span className="text-sm text-stone-500">{queueCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-1">
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : queue.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">No staging items for this filter.</p>
            ) : (
              <div className="space-y-3">
                {queue.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedId === row.id
                        ? 'border-[#00E676] bg-[#00E676]/10'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wider text-stone-500">#{row.id}</p>
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

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
            {loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : !selectedStaging ? (
              <p className="py-16 text-center text-sm text-stone-500">Select a staging item to review.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-stone-950">{selectedStaging.title}</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
                    {selectedStaging.review_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase text-stone-500">Slug</p>
                    <p className="font-mono text-sm text-stone-800">/{selectedStaging.slug}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase text-stone-500">Folder</p>
                    <p className="text-sm text-stone-800">{selectedStaging.folder_name || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase text-stone-500">Submitted</p>
                    <p className="text-sm text-stone-800">{formatDate(selectedStaging.created_at)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase text-stone-500">Desired Status</p>
                    <p className="text-sm text-stone-800">{selectedStaging.desired_status || 'draft'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-700">Body Preview</p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <pre className="whitespace-pre-wrap text-sm text-stone-700">{selectedStaging.body || ''}</pre>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-700">Staged Images ({selectedImages.length})</p>
                  {selectedImages.length === 0 ? (
                    <p className="text-sm text-stone-500">No images in staging.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {selectedImages.map((img) => (
                        <div key={img.id} className="rounded-lg border border-stone-200 bg-stone-50 p-2">
                          <img src={img.url} alt={img.filename} className="aspect-square w-full rounded object-cover" />
                          <p className="mt-1 truncate text-[11px] text-stone-600">{img.filename}</p>
                          <p className="text-[10px] uppercase text-stone-500">{img.role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!isPending && selectedStaging.final_article_id ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Published to article #{selectedStaging.final_article_id}. Final linked images: {approvedImages.length}.
                  </div>
                ) : null}

                {isPending && (
                  <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Publish As</label>
                        <select
                          value={publishStatus}
                          onChange={(e) => setPublishStatus(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Reviewer Notes</label>
                        <input
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Optional notes"
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={approveSelected}
                        disabled={actionLoading !== ''}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#00E676] px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-[#00c853] disabled:opacity-60"
                      >
                        {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {`Approve (${publishStatus})`}
                      </button>
                      <button
                        onClick={rejectSelected}
                        disabled={actionLoading !== ''}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
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
