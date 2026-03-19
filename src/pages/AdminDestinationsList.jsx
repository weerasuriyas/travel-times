import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, MapPin, Loader2 } from 'lucide-react'
import { apiGet, apiDelete } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

export default function AdminDestinationsList() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('destinations')
      setDestinations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load destinations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (dest) => {
    if (!window.confirm(`Delete "${dest.name}"? This cannot be undone.`)) return
    try {
      await apiDelete(`destinations/${dest.id}`)
      setDestinations(prev => prev.filter(d => d.id !== dest.id))
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Destinations"
        action={
          <button
            onClick={() => navigate('/admin/destinations/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={14} />
            New Destination
          </button>
        }
      />

      <div className="px-6 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[#00E676]" size={28} />
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Destination</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Region</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Map Pin</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Hero Image</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {destinations.map(dest => (
                  <tr key={dest.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{dest.name}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">{dest.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-600 dark:text-stone-400">{dest.region || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        dest.status === 'published' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {dest.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {dest.lat && dest.lng
                        ? <span className="flex items-center gap-1 text-[#00E676] text-xs"><MapPin size={11} /> Set</span>
                        : <span className="text-stone-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {dest.hero_image
                        ? <img src={dest.hero_image} alt="" className="w-8 h-8 rounded object-cover" />
                        : <span className="text-stone-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/destinations/${dest.id}`)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(dest)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && destinations.length === 0 && (
              <p className="text-center py-12 text-stone-500 text-sm">No destinations yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
