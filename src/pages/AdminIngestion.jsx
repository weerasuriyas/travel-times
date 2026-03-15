import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FolderOpen, FileText, Image as ImageIcon, Check, AlertCircle, X, LogOut, ArrowLeft, Loader2, Folders } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiPost, apiUploadStagingImage } from '../lib/api'
import matter from 'gray-matter'
import mammoth from 'mammoth'

// Read all files from a directory entry (flat)
function readEntryFiles(entry) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(file => resolve([file]))
      return
    }
    if (entry.isDirectory) {
      const reader = entry.createReader()
      const allEntries = []
      const readBatch = () => {
        reader.readEntries(async (batch) => {
          if (!batch.length) {
            const results = await Promise.all(allEntries.map(readEntryFiles))
            resolve(results.flat())
            return
          }
          allEntries.push(...batch)
          readBatch()
        })
      }
      readBatch()
      return
    }
    resolve([])
  })
}

// Read only the immediate children of a directory entry
function readDirectChildren(entry) {
  return new Promise((resolve) => {
    if (!entry.isDirectory) { resolve([]); return }
    const reader = entry.createReader()
    const all = []
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) { resolve(all); return }
        all.push(...batch)
        readBatch()
      })
    }
    readBatch()
  })
}

async function parseDocx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result })
        const html = result.value
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
          : file.name.replace(/\.docx$/i, '').replace(/[-_]/g, ' ')
        resolve({ body: html, title })
      } catch (err) { reject(err) }
    }
    reader.readAsArrayBuffer(file)
  })
}

function parseMd(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { data: fm, content } = matter(e.target.result)
        resolve({ body: content, fm })
      } catch (err) { reject(err) }
    }
    reader.readAsText(file)
  })
}

function defaultMeta(overrides = {}) {
  return {
    title: '', slug: '', subtitle: '', category: 'Culture',
    tags: '', issue: '', author_name: 'Sanath Weerasuriya',
    author_role: 'Field Correspondent', read_time: 8,
    destination: '', event_slug: '', status: 'draft',
    ...overrides,
  }
}

async function buildArticle(folderName, files) {
  const imageFiles = files.filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name))
  const docxFile = files.find(f => /\.docx$/i.test(f.name))
  const mdFile = files.find(f => /\.(md|txt)$/i.test(f.name))

  let body = ''
  let meta = defaultMeta()

  if (docxFile) {
    const { body: b, title } = await parseDocx(docxFile)
    body = b
    meta = defaultMeta({ title })
  } else if (mdFile) {
    const { body: b, fm } = await parseMd(mdFile)
    body = b
    meta = defaultMeta({
      title: fm.title || '',
      slug: fm.slug || fm['event-slug'] || '',
      subtitle: fm.subtitle || '',
      category: fm.category || 'Culture',
      tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || ''),
      issue: fm.issue || '',
      author_name: fm['author-name'] || fm.author || 'Sanath Weerasuriya',
      author_role: fm['author-role'] || 'Field Correspondent',
      read_time: fm['read-time'] || fm.readTime || 8,
      destination: fm.destination || '',
      event_slug: fm['event-slug'] || '',
      status: fm.status || 'draft',
    })
  }

  const images = imageFiles.map(f => ({
    file: f,
    preview: URL.createObjectURL(f),
    role: /hero|cover|banner/i.test(f.name) ? 'hero' : 'gallery',
    name: f.name,
  }))

  return { folderName, body, meta, images }
}

export default function AdminIngestion() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [mode, setMode] = useState(null) // null | 'single' | 'batch'

  // Single mode state
  const [step, setStep] = useState('drop')
  const [images, setImages] = useState([])
  const [folderName, setFolderName] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [meta, setMeta] = useState(defaultMeta())
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Batch mode state
  const [batch, setBatch] = useState([]) // array of { folderName, body, meta, images }
  const [batchProgress, setBatchProgress] = useState(null) // { current, total, currentName, done, errors }

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') }
    catch (e) { console.error('Error signing out:', e) }
  }

  // ── Drop handler ──────────────────────────────────────────────
  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    const items = Array.from(e.dataTransfer.items || [])
    const entries = items.map(i => i.webkitGetAsEntry?.()).filter(Boolean)

    // Check if any top-level entry is a directory containing subdirectories with docs
    if (entries.length === 1 && entries[0].isDirectory) {
      const topDir = entries[0]
      const children = await readDirectChildren(topDir)
      const subDirs = children.filter(c => c.isDirectory)

      if (subDirs.length > 0) {
        // Batch mode: parent folder with article subfolders
        setMode('batch')
        setBatchProgress({ current: 0, total: subDirs.length, currentName: 'Scanning...', done: false, errors: [] })

        const articles = []
        for (let i = 0; i < subDirs.length; i++) {
          const dir = subDirs[i]
          setBatchProgress(p => ({ ...p, current: i, currentName: dir.name }))
          const files = await readEntryFiles(dir)
          const article = await buildArticle(dir.name, files)
          articles.push(article)
        }

        setBatch(articles)
        setBatchProgress(null)
        return
      }
    }

    // Single mode: flat folder or multiple files
    setMode('single')
    const allFiles = []
    for (const entry of entries) {
      const files = await readEntryFiles(entry)
      allFiles.push(...files)
    }
    handleSingleFiles(allFiles, entries[0]?.name || '')
  }, [])

  const handleInputChange = useCallback(async (e) => {
    setError(null)
    const allFiles = Array.from(e.target.files)
    if (!allFiles.length) return

    // Group by top-level folder
    const byFolder = {}
    for (const f of allFiles) {
      const parts = (f.webkitRelativePath || f.name).split('/')
      const top = parts[0]
      if (!byFolder[top]) byFolder[top] = []
      byFolder[top].push(f)
    }

    const folders = Object.keys(byFolder)

    if (folders.length > 1) {
      // Batch mode
      setMode('batch')
      const articles = []
      for (const folder of folders) {
        const article = await buildArticle(folder, byFolder[folder])
        articles.push(article)
      }
      setBatch(articles)
    } else {
      setMode('single')
      handleSingleFiles(allFiles, folders[0] || '')
    }
  }, [])

  function handleSingleFiles(allFiles, derivedFolder) {
    const imageFiles = allFiles.filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name))
    const mdFile = allFiles.find(f => /\.(md|txt)$/i.test(f.name))
    const docxFile = allFiles.find(f => /\.docx$/i.test(f.name))
    setFolderName(derivedFolder)

    setImages(imageFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      role: /hero|cover|banner/i.test(f.name) ? 'hero' : 'gallery',
      name: f.name,
    })))

    if (docxFile) {
      parseDocx(docxFile).then(({ body, title }) => {
        setMarkdown(body)
        setMeta(prev => ({ ...prev, title: title || prev.title }))
        setStep('preview')
      }).catch(() => setError('Failed to parse Word document'))
    } else if (mdFile) {
      parseMd(mdFile).then(({ body, fm }) => {
        setMarkdown(body)
        setMeta(prev => ({
          ...prev,
          title: fm.title || prev.title,
          slug: fm.slug || fm['event-slug'] || prev.slug,
          subtitle: fm.subtitle || prev.subtitle,
          category: fm.category || prev.category,
          tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || prev.tags),
          issue: fm.issue || prev.issue,
          author_name: fm['author-name'] || fm.author || prev.author_name,
          author_role: fm['author-role'] || prev.author_role,
          read_time: fm['read-time'] || fm.readTime || prev.read_time,
          destination: fm.destination || prev.destination,
          event_slug: fm['event-slug'] || prev.event_slug,
          status: fm.status || prev.status,
        }))
        setStep('preview')
      }).catch(() => { setMarkdown(''); setStep('preview') })
    } else if (imageFiles.length > 0) {
      setStep('preview')
    }
  }

  const updateMeta = (field, value) => setMeta(prev => ({ ...prev, [field]: value }))
  const setImageRole = (idx, role) => setImages(prev => prev.map((img, i) => i === idx ? { ...img, role } : img))
  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  // ── Single submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setStep('uploading')
    setError(null)
    const total = 1 + images.length
    setProgress({ current: 0, total, message: 'Creating staging record...' })

    try {
      const tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
      const stagingRes = await apiPost('staging', {
        folder_name: folderName || null,
        title: meta.title, slug: meta.slug || undefined,
        subtitle: meta.subtitle, category: meta.category, tags,
        issue: meta.issue, author_name: meta.author_name,
        author_role: meta.author_role,
        read_time: parseInt(meta.read_time) || null,
        body: markdown,
        destination: meta.destination || undefined,
        event_slug: meta.event_slug || undefined,
        status: meta.status,
      })

      setProgress({ current: 1, total, message: 'Uploading images...' })
      const uploadedImages = []
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        setProgress({ current: 1 + i, total, message: `Uploading ${img.name} (${i + 1}/${images.length})...` })
        const imgRes = await apiUploadStagingImage(img.file, stagingRes.id, img.role, img.name, i)
        uploadedImages.push(imgRes)
      }

      setProgress({ current: total, total, message: 'Done' })
      setResult({ staging: stagingRes, images: uploadedImages })
      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('preview')
    }
  }

  // ── Batch submit ──────────────────────────────────────────────
  const handleBatchSubmit = async () => {
    const errors = []
    setBatchProgress({ current: 0, total: batch.length, currentName: '', done: false, errors: [] })

    for (let i = 0; i < batch.length; i++) {
      const article = batch[i]
      setBatchProgress(p => ({ ...p, current: i, currentName: article.folderName }))

      try {
        const tags = article.meta.tags.split(',').map(t => t.trim()).filter(Boolean)
        const stagingRes = await apiPost('staging', {
          folder_name: article.folderName,
          title: article.meta.title || article.folderName,
          slug: article.meta.slug || undefined,
          subtitle: article.meta.subtitle,
          category: article.meta.category,
          tags, issue: article.meta.issue,
          author_name: article.meta.author_name,
          author_role: article.meta.author_role,
          read_time: parseInt(article.meta.read_time) || null,
          body: article.body,
          destination: article.meta.destination || undefined,
          event_slug: article.meta.event_slug || undefined,
          status: article.meta.status,
        })

        for (let j = 0; j < article.images.length; j++) {
          const img = article.images[j]
          await apiUploadStagingImage(img.file, stagingRes.id, img.role, img.name, j)
        }
      } catch (err) {
        errors.push({ folder: article.folderName, error: err.message })
      }
    }

    setBatchProgress({ current: batch.length, total: batch.length, currentName: '', done: true, errors })
  }

  const reset = () => {
    setMode(null)
    setStep('drop')
    setImages([]); setFolderName(''); setMarkdown('')
    setMeta(defaultMeta())
    setProgress({ current: 0, total: 0, message: '' })
    setResult(null); setError(null)
    setBatch([]); setBatchProgress(null)
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Article Ingestion</h1>
              <p className="text-stone-400 text-sm mt-1">Drop a folder or parent folder to ingest</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                <ArrowLeft size={16} /> Dashboard
              </button>
              <button onClick={() => navigate('/')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                ← Back to Site
              </button>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div><p className="font-medium text-red-800">Error</p><p className="text-sm text-red-600">{error}</p></div>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} className="text-red-400" /></button>
          </div>
        )}

        {/* Drop Zone */}
        {!mode && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-stone-300 rounded-2xl p-16 text-center hover:border-[#00E676] transition-colors cursor-pointer bg-white"
          >
            <FolderOpen className="mx-auto mb-4 text-stone-400" size={64} />
            <h2 className="text-2xl font-bold text-stone-950 mb-2">Drop Article Folder(s) Here</h2>
            <p className="text-stone-500 mb-6">
              Drop a <strong>single article folder</strong> or a <strong>parent folder</strong> containing multiple article folders
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-stone-950 cursor-pointer transition-all shadow-sm"
              style={{ backgroundColor: '#00E676' }}>
              <Upload size={20} />
              Select Folder
              <input type="file" webkitdirectory="true" directory="true" multiple
                onChange={handleInputChange} className="hidden" />
            </label>
            <p className="text-xs text-stone-400 mt-4">Or drag and drop</p>

            <div className="mt-10 grid grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="font-bold text-xs text-stone-600 mb-2">Single article</p>
                <pre className="text-xs text-stone-500 font-mono">{`my-article/
  article.docx
  cover.jpg
  photo1.jpg`}</pre>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="font-bold text-xs text-stone-600 mb-2">Batch (parent folder)</p>
                <pre className="text-xs text-stone-500 font-mono">{`articles/
  article-one/
    article.docx
    cover.jpg
  article-two/
    article.docx
    photo.jpg`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Scanning batch */}
        {mode === 'batch' && batchProgress && !batchProgress.done && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <Loader2 className="mx-auto mb-4 text-[#00E676] animate-spin" size={48} />
            <h2 className="text-xl font-bold text-stone-950 mb-2">
              {batchProgress.current === 0 && batchProgress.total === batch.length && batch.length === 0
                ? 'Scanning folders...'
                : `Staging ${batchProgress.current + 1} of ${batchProgress.total}...`}
            </h2>
            <p className="text-stone-500">{batchProgress.currentName}</p>
          </div>
        )}

        {/* Batch preview */}
        {mode === 'batch' && !batchProgress && batch.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-950 flex items-center gap-2">
                  <Folders size={22} /> {batch.length} Articles Detected
                </h2>
                <p className="text-sm text-stone-500 mt-1">Review the list then stage all for review</p>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm font-medium">
                  Start Over
                </button>
                <button onClick={handleBatchSubmit}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                  style={{ backgroundColor: '#00E676' }}>
                  <Upload size={18} /> Stage All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {batch.map((article, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-stone-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-950 truncate">{article.meta.title || article.folderName}</p>
                    <p className="text-xs text-stone-400">{article.folderName} · {article.images.length} image{article.images.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {article.images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img.preview} alt={img.name}
                        className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                    ))}
                    {article.images.length > 3 && (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-xs text-stone-500 font-medium">
                        +{article.images.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch uploading */}
        {mode === 'batch' && batchProgress && !batchProgress.done && batch.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <Loader2 className="mx-auto mb-4 text-[#00E676] animate-spin" size={48} />
            <h2 className="text-xl font-bold text-stone-950 mb-1">Staging articles...</h2>
            <p className="text-stone-500 mb-6">{batchProgress.currentName}</p>
            <div className="w-full max-w-md mx-auto bg-stone-100 rounded-full h-3">
              <div className="bg-[#00E676] h-3 rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-2">{batchProgress.current} / {batchProgress.total}</p>
          </div>
        )}

        {/* Batch done */}
        {mode === 'batch' && batchProgress?.done && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00E676]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="text-[#00E676]" size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-950 mb-2">
              {batchProgress.total - batchProgress.errors.length} of {batchProgress.total} Articles Staged
            </h2>
            {batchProgress.errors.length > 0 && (
              <div className="mt-4 text-left max-w-md mx-auto space-y-2">
                {batchProgress.errors.map((e, i) => (
                  <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <p className="font-medium text-red-800">{e.folder}</p>
                    <p className="text-red-600">{e.error}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center mt-8">
              <button onClick={reset}
                className="px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                style={{ backgroundColor: '#00E676' }}>
                Ingest More
              </button>
              <button onClick={() => navigate('/admin/staging')}
                className="px-6 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium text-sm">
                Review Queue
              </button>
            </div>
          </div>
        )}

        {/* ── Single mode ── */}
        {mode === 'single' && step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-950">Review & Edit</h2>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm font-medium">
                  Start Over
                </button>
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                  style={{ backgroundColor: '#00E676' }}>
                  <Upload size={18} /> Stage Article
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Title *', field: 'title', bold: true },
                  { label: 'Slug', field: 'slug', placeholder: 'auto-generated from title' },
                  { label: 'Subtitle', field: 'subtitle', span: 2 },
                  { label: 'Author', field: 'author_name' },
                  { label: 'Author Role', field: 'author_role' },
                  { label: 'Issue', field: 'issue', placeholder: 'Issue 04: The Relic' },
                  { label: 'Read Time (min)', field: 'read_time', type: 'number' },
                  { label: 'Tags (comma-separated)', field: 'tags', placeholder: 'Festival, Heritage' },
                ].map(({ label, field, bold, span, placeholder, type }) => (
                  <div key={field} className={span === 2 ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">{label}</label>
                    <input type={type || 'text'} value={meta[field]}
                      onChange={e => updateMeta(field, e.target.value)}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${bold ? 'font-bold' : ''}`} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Category</label>
                  <select value={meta.category} onChange={e => updateMeta('category', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option>Culture</option><option>Travel</option><option>Food</option>
                    <option>Adventure</option><option>Nature</option><option>Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Status</label>
                  <select value={meta.status} onChange={e => updateMeta('status', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {markdown && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-950 flex items-center gap-2"><FileText size={18} /> Article Body</h3>
                  <span className="text-xs text-stone-500">{markdown.length} chars</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono">{markdown}</pre>
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="font-bold text-stone-950 flex items-center gap-2 mb-4"><ImageIcon size={18} /> Images ({images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview} alt={img.name} className="w-full aspect-square object-cover rounded-lg border border-stone-200" />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X size={12} />
                      </button>
                      <p className="text-[10px] text-stone-500 mt-1 truncate">{img.name}</p>
                      <select value={img.role} onChange={e => setImageRole(idx, e.target.value)}
                        className="w-full mt-1 text-xs px-2 py-1 border border-stone-200 rounded cursor-pointer">
                        <option value="hero">Hero</option><option value="gallery">Gallery</option>
                        <option value="section">Section</option><option value="cover">Cover</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'single' && step === 'uploading' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <Loader2 className="mx-auto mb-4 text-[#00E676] animate-spin" size={48} />
            <h2 className="text-xl font-bold text-stone-950 mb-2">Staging...</h2>
            <p className="text-stone-500 mb-6">{progress.message}</p>
            <div className="w-full max-w-md mx-auto bg-stone-100 rounded-full h-3">
              <div className="bg-[#00E676] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-2">{progress.current} / {progress.total}</p>
          </div>
        )}

        {mode === 'single' && step === 'done' && result && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00E676]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="text-[#00E676]" size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-950 mb-2">Article Staged for Review</h2>
            <p className="text-stone-500 mb-2">
              Staging #{result.staging.id} — <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">{result.staging.slug}</code>
            </p>
            <p className="text-stone-400 text-sm mb-8">
              {result.images.length} image{result.images.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={reset}
                className="px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                style={{ backgroundColor: '#00E676' }}>
                Ingest Another
              </button>
              <button onClick={() => navigate('/admin/staging')}
                className="px-6 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium text-sm">
                Review Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
