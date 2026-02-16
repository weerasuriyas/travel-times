import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FolderOpen, FileText, Image as ImageIcon, Check, AlertCircle, X, LogOut, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiPost, apiUploadImage } from '../lib/api'
import matter from 'gray-matter'

export default function AdminIngestion() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [step, setStep] = useState('drop')
  const [files, setFiles] = useState([])
  const [images, setImages] = useState([])
  const [markdown, setMarkdown] = useState('')
  const [meta, setMeta] = useState({
    title: '', slug: '', subtitle: '', category: 'Culture',
    tags: '', issue: '', author_name: 'Sanath Weerasuriya',
    author_role: 'Field Correspondent', read_time: 8,
    destination: '', event_slug: '', status: 'draft',
  })
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') }
    catch (e) { console.error('Error signing out:', e) }
  }

  const handleFiles = useCallback((fileList) => {
    const allFiles = Array.from(fileList)
    const imageFiles = allFiles.filter(f =>
      /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name)
    )
    const mdFile = allFiles.find(f => /\.(md|txt)$/i.test(f.name))

    setFiles(allFiles)
    setImages(imageFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      role: f.name.match(/hero|cover|banner/i) ? 'hero' : 'gallery',
      name: f.name,
    })))

    if (mdFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const raw = e.target.result
        try {
          const { data: fm, content } = matter(raw)
          setMarkdown(content)
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
        } catch {
          setMarkdown(raw)
        }
        setStep('preview')
      }
      reader.readAsText(mdFile)
    } else if (imageFiles.length > 0) {
      setStep('preview')
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const items = e.dataTransfer.items
    if (items) {
      const filePromises = []
      for (const item of items) {
        const entry = item.webkitGetAsEntry?.()
        if (entry) {
          filePromises.push(readEntry(entry))
        }
      }
      Promise.all(filePromises).then(results => {
        handleFiles(results.flat())
      })
    } else {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const readEntry = (entry) => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(file => resolve([file]))
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        reader.readEntries(async (entries) => {
          const results = await Promise.all(entries.map(readEntry))
          resolve(results.flat())
        })
      }
    })
  }

  const handleInputChange = (e) => {
    handleFiles(e.target.files)
  }

  const updateMeta = (field, value) => {
    setMeta(prev => ({ ...prev, [field]: value }))
  }

  const setImageRole = (idx, role) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, role } : img))
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    setStep('uploading')
    setError(null)
    const total = 1 + images.length
    setProgress({ current: 0, total, message: 'Creating article...' })

    try {
      const tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
      const articleRes = await apiPost('articles', {
        title: meta.title,
        slug: meta.slug || undefined,
        subtitle: meta.subtitle,
        category: meta.category,
        tags,
        issue: meta.issue,
        author_name: meta.author_name,
        author_role: meta.author_role,
        read_time: parseInt(meta.read_time) || null,
        body: markdown,
        status: meta.status,
      })

      setProgress({ current: 1, total, message: 'Uploading images...' })

      const uploadedImages = []
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        setProgress({
          current: 1 + i,
          total,
          message: `Uploading ${img.name} (${i + 1}/${images.length})...`
        })
        const imgRes = await apiUploadImage(
          img.file, 'article', articleRes.id, img.role, img.name
        )
        uploadedImages.push(imgRes)

        if (img.role === 'hero') {
          await apiPost(`articles/${articleRes.id}`, { ...meta, cover_image: imgRes.url }).catch(() => {})
        }
      }

      setProgress({ current: total, total, message: 'Done!' })
      setResult({ article: articleRes, images: uploadedImages })
      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('preview')
    }
  }

  const reset = () => {
    setStep('drop')
    setFiles([])
    setImages([])
    setMarkdown('')
    setMeta({
      title: '', slug: '', subtitle: '', category: 'Culture',
      tags: '', issue: '', author_name: 'Sanath Weerasuriya',
      author_role: 'Field Correspondent', read_time: 8,
      destination: '', event_slug: '', status: 'draft',
    })
    setProgress({ current: 0, total: 0, message: '' })
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Article Ingestion</h1>
              <p className="text-stone-400 text-sm mt-1">Drop a folder to ingest</p>
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
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} className="text-red-400" /></button>
          </div>
        )}

        {/* Step 1: Drop Zone */}
        {step === 'drop' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-stone-300 rounded-2xl p-16 text-center hover:border-[#00E676] transition-colors cursor-pointer bg-white"
          >
            <FolderOpen className="mx-auto mb-4 text-stone-400" size={64} />
            <h2 className="text-2xl font-bold text-stone-950 mb-2">Drop Article Folder Here</h2>
            <p className="text-stone-500 mb-6">
              Folder should contain <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">article.md</code> and an <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">images/</code> folder
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-stone-950 cursor-pointer transition-all shadow-sm"
              style={{ backgroundColor: '#00E676' }}>
              <Upload size={20} />
              Select Folder
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-stone-400 mt-4">Or drag and drop a folder directly</p>

            <div className="mt-12 text-left max-w-md mx-auto bg-stone-50 rounded-xl p-6">
              <h3 className="font-bold text-sm text-stone-700 mb-3">Expected folder format:</h3>
              <pre className="text-xs text-stone-600 font-mono leading-relaxed">{`my-article/
  article.md        ← YAML frontmatter + body
  images/
    cover.jpg       ← named "hero/cover/banner" = auto-hero
    photo1.jpg
    photo2.webp`}</pre>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Edit */}
        {step === 'preview' && (
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
                  <Upload size={18} /> Ingest Article
                </button>
              </div>
            </div>

            {/* Metadata Form */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Title *</label>
                  <input value={meta.title} onChange={e => updateMeta('title', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Slug</label>
                  <input value={meta.slug} onChange={e => updateMeta('slug', e.target.value)}
                    placeholder="auto-generated from title"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Subtitle</label>
                  <input value={meta.subtitle} onChange={e => updateMeta('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Category</label>
                  <select value={meta.category} onChange={e => updateMeta('category', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option>Culture</option><option>Travel</option><option>Food</option>
                    <option>Adventure</option><option>Nature</option><option>Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Tags (comma-separated)</label>
                  <input value={meta.tags} onChange={e => updateMeta('tags', e.target.value)}
                    placeholder="Festival, Heritage, Buddhist"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Author</label>
                  <input value={meta.author_name} onChange={e => updateMeta('author_name', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Author Role</label>
                  <input value={meta.author_role} onChange={e => updateMeta('author_role', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Issue</label>
                  <input value={meta.issue} onChange={e => updateMeta('issue', e.target.value)}
                    placeholder="Issue 04: The Relic"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Read Time (min)</label>
                  <input type="number" value={meta.read_time} onChange={e => updateMeta('read_time', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
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

            {/* Article Body Preview */}
            {markdown && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-950 flex items-center gap-2">
                    <FileText size={18} /> Article Body
                  </h3>
                  <span className="text-xs text-stone-500">{markdown.length} chars</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono">{markdown}</pre>
                </div>
              </div>
            )}

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="font-bold text-stone-950 flex items-center gap-2 mb-4">
                  <ImageIcon size={18} /> Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview} alt={img.name}
                        className="w-full aspect-square object-cover rounded-lg border border-stone-200" />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X size={12} />
                      </button>
                      <p className="text-[10px] text-stone-500 mt-1 truncate">{img.name}</p>
                      <select value={img.role} onChange={e => setImageRole(idx, e.target.value)}
                        className="w-full mt-1 text-xs px-2 py-1 border border-stone-200 rounded cursor-pointer">
                        <option value="hero">Hero</option>
                        <option value="gallery">Gallery</option>
                        <option value="section">Section</option>
                        <option value="cover">Cover</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Uploading */}
        {step === 'uploading' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <Loader2 className="mx-auto mb-4 text-[#00E676] animate-spin" size={48} />
            <h2 className="text-xl font-bold text-stone-950 mb-2">Ingesting...</h2>
            <p className="text-stone-500 mb-6">{progress.message}</p>
            <div className="w-full max-w-md mx-auto bg-stone-100 rounded-full h-3">
              <div className="bg-[#00E676] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-2">{progress.current} / {progress.total}</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && result && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00E676]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="text-[#00E676]" size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-950 mb-2">Article Ingested!</h2>
            <p className="text-stone-500 mb-2">
              Article #{result.article.id} — <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">{result.article.slug}</code>
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
              <button onClick={() => navigate('/admin')}
                className="px-6 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium text-sm">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
