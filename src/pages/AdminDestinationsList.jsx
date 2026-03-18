import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, MapPin, LogOut, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiDelete } from '../lib/api'

export default function AdminDestinationsList() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
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

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#111111]">
      <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07] bg-[#111111]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Admin</span>
          </button>
          <span className="text-stone-700 text-xs">/</span>
          <span className="text-sm text-stone-200 font-medium">Destinations</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/destinations/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={14} />
            New Destination
          </button>
          <button onClick={handleSignOut} className="text-stone-600 hover:text-red-400 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6">
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[#00E676]" size={28} />
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Destination</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Region</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Map Pin</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Hero Image</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {destinations.map(dest => (
                  <tr key={dest.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-100">{dest.name}</p>
                        <p className="text-[11px] text-stone-500">{dest.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-400">{dest.region || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        dest.status === 'published' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-stone-700 text-stone-400'
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
                          className="p-1.5 rounded-lg hover:bg-white/10 text-stone-500 hover:text-stone-200 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(dest)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition-colors"
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
