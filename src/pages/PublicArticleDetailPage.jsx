import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SharedHeader } from '../components/UI'
import { useScrolled } from '../hooks/useScrolled'
import ArticleDetailView from '../components/ArticleDetailView'
import { apiGet } from '../lib/api'

export default function PublicArticleDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isScrolled = useScrolled(50)
  const [article, setArticle] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    apiGet(`articles/${slug}`)
      .then(data => {
        if (!data || data.error) { setNotFound(true); return }
        setArticle(data)
        setImages(Array.isArray(data.images) ? data.images : [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const articleWithImages = article ? { ...article, images } : null

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <SharedHeader isScrolled={isScrolled} showTabs={false} />

      <main className="pt-48 md:pt-44 pb-32">
        {/* Back button */}
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 mb-6">
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={14} /> All Stories
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-32">
            <p className="text-stone-400 text-sm uppercase tracking-widest mb-6">Story not found</p>
            <button onClick={() => navigate('/articles')} className="px-6 py-3 bg-stone-950 text-white rounded-full font-black uppercase tracking-widest text-xs">
              Back to Stories
            </button>
          </div>
        )}

        {!loading && articleWithImages && (
          <ArticleDetailView article={articleWithImages} />
        )}
      </main>
    </div>
  )
}
