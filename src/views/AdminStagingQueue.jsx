'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, CheckCircle2, Loader2, PencilLine, RefreshCw, Trash2, X } from 'lucide-react'
import { apiGetAuth, apiPatch, apiPost, apiDelete } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'
import { useAdminInbox } from '../contexts/AdminInboxContext'

const REVIEW_FILTERS = [
  { key: 'pending',  label: 'Waiting for review' },
  { key: 'approved', label: 'Already approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'Everything' },
]

const REVIEW_WORDS = {
  pending:  { label: 'Waiting for review', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' },
  approved: { label: 'Approved',           cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' },
  rejected: { label: 'Rejected',           cls: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
}

const EMPTY_QUEUE = {
  pending:  'Nothing is waiting for review. You are all caught up.',
  approved: 'No approved articles yet.',
  rejected: 'No rejected articles.',
  all:      'No uploaded articles yet.',
}

const LABEL_CLS = 'mb-1 block text-sm font-semibold text-stone-700 dark:text-stone-300'
const INPUT_CLS = 'w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2.5 text-base'
const ACTION_BTN = 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold transition-colors disabled:opacity-60'
const SAVE_DEBOUNCE_MS = 800

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function EditField({ label, value, onChange, type = 'text', rows, readOnly }) {
  if (readOnly) {
    return (
      <div>
        <p className={LABEL_CLS}>{label}</p>
        <p className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 text-base text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
          {value || '—'}
        </p>
      </div>
    )
  }
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      {rows ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows} className={`${INPUT_CLS} leading-relaxed`} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className={INPUT_CLS} />
      )}
    </label>
  )
}

export default function AdminStagingQueue() {
  const searchParams = useSearchParams()
  const requestedItem = searchParams.get('item')
  const { reload: reloadInbox } = useAdminInbox()

  const [reviewFilter, setReviewFilter] = useState('pending')
  const [queue, setQueue] = useState([])
  const [selectedId, setSelectedId] = useState(requestedItem)
  // On a phone the list and the article take turns on screen
  const [showDetail, setShowDetail] = useState(!!requestedItem)
  const [notice, setNotice] = useState(null)
  const [selected, setSelected] = useState(null)
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
  const queueLoadedRef = useRef(false)
  const debounceRef = useRef(null)
  const inflightRef = useRef(0)
  const captionStagingDebounce = useRef({})

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

  const loadQueue = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const query = reviewFilter === 'all' ? 'staging' : `staging?review_status=${reviewFilter}`
      const data = await apiGetAuth(query)
      const rows = Array.isArray(data) ? data : []
      queueLoadedRef.current = true
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
        article_type: s.article_type || 'story',
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
    // Until the first load finishes, keep the article asked for in the link
    if (!queueLoadedRef.current) return
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

  const handleStagingCaption = useCallback((storedFilename, caption) => {
    if (!selected) return
    setSelected(prev => ({
      ...prev,
      images: (prev?.images || []).map(img =>
        img.stored_filename === storedFilename ? { ...img, caption } : img
      ),
    }))
    clearTimeout(captionStagingDebounce.current[storedFilename])
    captionStagingDebounce.current[storedFilename] = setTimeout(() => {
      apiPatch('staging-images', {
        staging_folder: selected.folder,
        filename: storedFilename,
        caption,
      }).catch(() => {})
    }, 600)
  }, [selected])

  const afterDecision = async (folder) => {
    reloadInbox()
    await loadQueue()
    // In the waiting list the article drops out and the next one opens by
    // itself; in the other lists it stays, so show its new state.
    if (reviewFilter !== 'pending') await loadDetail(folder)
  }

  const approveSelected = async (status) => {
    if (!selectedStaging || !isPending) return
    const title = editFields.title || selectedStaging.title
    if (status === 'published' && !window.confirm(`Publish “${title}”?\n\nIt will appear on the website straight away.`)) return
    setActionLoading(status)
    setError('')
    setNotice(null)
    try {
      const result = await apiPost(`staging/${selectedStaging.folder}/approve`, { status, review_notes: reviewNotes })
      setNotice({ kind: status, title, articleId: result.article_id, articleSlug: result.article_slug })
      await afterDecision(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Could not approve this article. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const rejectSelected = async () => {
    if (!selectedStaging || !isPending) return
    const title = editFields.title || selectedStaging.title
    if (!window.confirm(`Reject “${title}”?\n\nIt will leave your review list and will not go on the website.`)) return
    setActionLoading('reject')
    setError('')
    setNotice(null)
    try {
      await apiPost(`staging/${selectedStaging.folder}/reject`, { review_notes: reviewNotes })
      setNotice({ kind: 'rejected', title })
      await afterDecision(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Could not reject this article. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const deleteSelected = async () => {
    if (!selectedStaging) return
    const title = editFields.title || selectedStaging.title
    if (!window.confirm(`Delete “${title}” and its photos for good?\n\nThis cannot be undone.`)) return
    setActionLoading('delete')
    setError('')
    setNotice(null)
    try {
      await apiDelete(`staging/${selectedStaging.folder}`)
      reloadInbox()
      await loadQueue()
    } catch (err) {
      setError(err.message || 'Could not delete this article. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const position = queue.findIndex(r => r.folder === selectedId)

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-sm text-stone-500 animate-pulse">Saving your changes…</span>
    : saveStatus === 'error'
    ? <span className="text-sm font-semibold text-red-600">Your last change was not saved</span>
    : <span className="text-sm text-emerald-700 dark:text-emerald-400">All changes saved</span>

  return (
    <div className="h-full flex flex-col">
      <AdminPageHeader
        title="Review articles"
        description="Read each article, fix anything you like, then publish it or save it as a draft."
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 md:px-6 py-4 md:py-6">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-base text-red-800 dark:text-red-300 flex justify-between items-center gap-3 flex-shrink-0">
            {error}
            <button onClick={() => setError('')} aria-label="Dismiss" className="p-1"><X size={18} /></button>
          </div>
        )}

        {notice && (
          <div role="status" className="mb-4 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 flex-shrink-0">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <p className="flex-1 min-w-48 text-base text-stone-800 dark:text-stone-200">
              {notice.kind === 'published' && <><strong className="font-semibold">Published:</strong> “{notice.title}”. It is now live on the website.</>}
              {notice.kind === 'draft' && <><strong className="font-semibold">Saved as a draft:</strong> “{notice.title}”. You can find it under Drafts.</>}
              {notice.kind === 'archived' && <><strong className="font-semibold">Archived:</strong> “{notice.title}”.</>}
              {notice.kind === 'rejected' && <><strong className="font-semibold">Rejected:</strong> “{notice.title}”. It has left your review list.</>}
            </p>
            {notice.kind === 'published' && notice.articleSlug && (
              <a href={`/article/${notice.articleSlug}`} target="_blank" rel="noreferrer" className="text-base font-semibold underline text-stone-900 dark:text-stone-100">View on website</a>
            )}
            {notice.kind === 'draft' && notice.articleId && (
              <Link href={`/admin/articles/${notice.articleId}`} className="text-base font-semibold underline text-stone-900 dark:text-stone-100">Open the draft</Link>
            )}
            <button onClick={() => setNotice(null)} aria-label="Dismiss" className="p-1 text-stone-500"><X size={18} /></button>
          </div>
        )}

        <div className={`mb-4 flex-wrap items-center gap-3 flex-shrink-0 ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
          <label htmlFor="review-filter" className="text-base font-semibold text-stone-700 dark:text-stone-300">Show</label>
          <select id="review-filter" value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2.5 text-base">
            {REVIEW_FILTERS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button onClick={loadQueue} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-4 py-2.5 text-base font-semibold hover:bg-stone-100 dark:hover:bg-stone-700">
            <RefreshCw size={18} /> Refresh
          </button>
          <span className="text-base text-stone-600 dark:text-stone-400">
            {queue.length === 1 ? '1 article' : `${queue.length} articles`}
          </span>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Queue list */}
          <div className={`rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 lg:col-span-1 overflow-y-auto ${showDetail ? 'hidden lg:block' : ''}`}>
            {loadingList && queue.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : queue.length === 0 ? (
              <p className="px-5 py-10 text-center text-base text-stone-600 dark:text-stone-400">{EMPTY_QUEUE[reviewFilter]}</p>
            ) : (
              <ul className="divide-y divide-stone-200 dark:divide-stone-800">
                {queue.map(row => {
                  const isSelected = selectedId === row.folder
                  const words = REVIEW_WORDS[row.review_status] || REVIEW_WORDS.pending
                  return (
                    <li key={row.folder}>
                      <button
                        onClick={() => { setSelectedId(row.folder); setShowDetail(true) }}
                        aria-current={isSelected ? 'true' : undefined}
                        ref={isSelected ? el => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                        className={`w-full border-l-[6px] px-4 py-3.5 text-left transition-colors ${isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                      >
                        <span className="admin-title block text-base font-semibold leading-snug text-stone-900 dark:text-stone-100">{row.title || 'Untitled'}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
                          {reviewFilter !== 'pending' && <span className={`rounded-full px-2 py-0.5 font-semibold ${words.cls}`}>{words.label}</span>}
                          <span>{formatDate(row.submitted_at)}</span>
                          <span>{row.image_count === 1 ? '1 photo' : `${row.image_count || 0} photos`}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Detail panel */}
          <div className={`rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 lg:col-span-2 overflow-y-auto flex-col ${showDetail ? 'flex' : 'hidden lg:flex'}`}>
            {loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : !selectedStaging ? (
              <div className="py-16 px-6 text-center">
                <p className="text-base text-stone-600 dark:text-stone-400">
                  {queue.length === 0 ? EMPTY_QUEUE[reviewFilter] : 'Choose an article from the list to read it.'}
                </p>
                <button onClick={() => setShowDetail(false)} className="lg:hidden mt-4 inline-flex items-center gap-2 text-base font-semibold underline text-stone-900 dark:text-stone-100">
                  <ArrowLeft size={18} /> Back to the list
                </button>
              </div>
            ) : (
              <>
              <div className="flex-1 space-y-5 p-4 md:p-6">
                <button onClick={() => setShowDetail(false)} className="lg:hidden inline-flex items-center gap-2 text-base font-semibold underline text-stone-900 dark:text-stone-100">
                  <ArrowLeft size={18} /> Back to the list
                </button>

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${(REVIEW_WORDS[selectedStaging.review_status] || REVIEW_WORDS.pending).cls}`}>
                      {(REVIEW_WORDS[selectedStaging.review_status] || REVIEW_WORDS.pending).label}
                    </span>
                    {position >= 0 && queue.length > 1 && (
                      <span className="text-sm text-stone-600 dark:text-stone-400">Article {position + 1} of {queue.length}</span>
                    )}
                    {!readOnly && saveIndicator}
                  </div>
                  <button
                    onClick={deleteSelected}
                    disabled={actionLoading !== ''}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60"
                  >
                    {actionLoading === 'delete' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    Delete for good
                  </button>
                </div>

                {(readOnly && selectedStaging.review_status !== 'pending') || reviewedMidSession ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-4 py-3 text-base text-amber-900 dark:text-amber-200">
                    This article has already been reviewed, so it can no longer be changed here.
                    {selectedStaging.final_article_id ? (
                      <> <Link href={`/admin/articles/${selectedStaging.final_article_id}`} className="font-semibold underline">Open it in the editor</Link> to make changes.</>
                    ) : null}
                  </div>
                ) : null}

                {/* Editable fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <EditField label="Title" value={editFields.title} onChange={v => updateField('title', v)} readOnly={readOnly} />
                  </div>
                  <div className="md:col-span-2">
                    <EditField label="Subtitle" value={editFields.subtitle} onChange={v => updateField('subtitle', v)} readOnly={readOnly} />
                  </div>
                  <EditField label="Author" value={editFields.author_name} onChange={v => updateField('author_name', v)} readOnly={readOnly} />
                  <EditField label="Category" value={editFields.category} onChange={v => updateField('category', v)} readOnly={readOnly} />
                </div>

                {/* Body */}
                <EditField label="Article text" value={editFields.body} onChange={v => updateField('body', v)} rows={16} readOnly={readOnly} />

                {/* Images */}
                <div>
                  <p className={LABEL_CLS}>{selectedImages.length === 1 ? '1 photo' : `${selectedImages.length} photos`}</p>
                  {selectedImages.length === 0 ? (
                    <p className="text-base text-stone-600 dark:text-stone-400">This article came without photos. You can add some later in the editor.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedImages.map(img => (
                        <div key={img.stored_filename} className="flex flex-col gap-1.5">
                          <div className="relative">
                            <img src={img.url} alt={img.original_filename} className="aspect-[4/3] w-full rounded-lg object-cover bg-stone-100 dark:bg-stone-800" />
                            {img.role === 'hero' || img.role === 'cover' ? (
                              <span className="absolute left-2 bottom-2 rounded bg-stone-950/80 px-2 py-0.5 text-sm font-semibold text-white">Cover photo</span>
                            ) : null}
                            {isPending && (
                              <button
                                onClick={() => deleteImage(img)}
                                aria-label={`Remove photo ${img.original_filename}`}
                                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-sm font-semibold text-red-700 shadow"
                              >
                                <X size={14} /> Remove
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={img.caption || ''}
                            onChange={e => handleStagingCaption(img.stored_filename, e.target.value)}
                            aria-label={`Caption for ${img.original_filename}`}
                            placeholder="Add a caption"
                            disabled={!isPending}
                            className="w-full text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg px-2.5 py-2 text-stone-800 dark:text-stone-200 placeholder-stone-500 disabled:opacity-70"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Less-used details, tucked away */}
                <details className="rounded-lg border border-stone-200 dark:border-stone-700">
                  <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-stone-800 dark:text-stone-200">More details (tags, destination, type)</summary>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 px-4 pb-4">
                    <EditField label="Tags, separated by commas" value={editFields.tags} onChange={v => updateField('tags', v)} readOnly={readOnly} />
                    <EditField label="Destination (short name used in its web address)" value={editFields.destination_slug} onChange={v => updateField('destination_slug', v)} readOnly={readOnly} />
                    <div>
                      <p className={LABEL_CLS}>Type</p>
                      {readOnly ? (
                        <p className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 text-base text-stone-700 dark:text-stone-300 capitalize">{editFields.article_type || 'story'}</p>
                      ) : (
                        <div className="flex rounded-lg overflow-hidden border border-stone-300 dark:border-stone-600">
                          {['story', 'event'].map(type => (
                            <button
                              key={type}
                              type="button"
                              aria-pressed={editFields.article_type === type}
                              onClick={() => updateField('article_type', type)}
                              className={`flex-1 py-2.5 text-base font-semibold transition-colors ${
                                editFields.article_type === type
                                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                              }`}
                            >
                              {type === 'story' ? 'Story' : 'Event'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {isPending && (
                      <div>
                        <label htmlFor="review-notes" className={LABEL_CLS}>Note to yourself (optional)</label>
                        <input id="review-notes" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className={INPUT_CLS} />
                      </div>
                    )}
                  </div>
                </details>
              </div>

              {/* The decision, always in reach at the bottom */}
              {isPending && (
                <div className="sticky bottom-0 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 md:px-6 py-3 rounded-b-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => approveSelected('published')} disabled={actionLoading !== ''} className={`${ACTION_BTN} bg-emerald-600 text-white hover:bg-emerald-700`}>
                      {actionLoading === 'published' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      Publish now
                    </button>
                    <button onClick={() => approveSelected('draft')} disabled={actionLoading !== ''} className={`${ACTION_BTN} border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700`}>
                      {actionLoading === 'draft' ? <Loader2 size={18} className="animate-spin" /> : <PencilLine size={18} />}
                      Save as a draft
                    </button>
                    <button onClick={rejectSelected} disabled={actionLoading !== ''} className={`${ACTION_BTN} ml-auto text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`}>
                      {actionLoading === 'reject' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                      Reject
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    Publish now puts it on the website. Save as a draft keeps it hidden so you can add photos and styling in the editor first.
                  </p>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
